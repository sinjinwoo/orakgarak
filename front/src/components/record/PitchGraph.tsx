import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface PitchGraphProps {
  isRecording: boolean;
}

interface PitchData {
  frequency: number;
  timestamp: number;
  note: string;
  octave: number;
  cents: number;
}

// YIN 알고리즘을 사용한 피치 감지
function detectPitch(buffer: Float32Array, sampleRate: number): PitchData | null {
  const minFreq = 80;
  const maxFreq = 400;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);
  
  let bestPeriod = 0;
  let bestCorrelation = 0;
  
  for (let period = minPeriod; period < maxPeriod; period++) {
    let correlation = 0;
    let normalization = 0;
    
    for (let i = 0; i < buffer.length - period; i++) {
      const diff = buffer[i] - buffer[i + period];
      correlation += diff * diff;
      normalization += buffer[i] * buffer[i];
    }
    
    if (normalization > 0) {
      correlation = 1 - (correlation / normalization);
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
  }
  
  if (bestCorrelation > 0.1 && bestPeriod > 0) {
    const frequency = sampleRate / bestPeriod;
    const noteData = frequencyToNote(frequency);
    
    return {
        frequency,
        timestamp: Date.now(),
      note: noteData.note,
      octave: noteData.octave,
      cents: noteData.cents
    };
  }
  
  return null;
}

// 주파수를 음표로 변환
function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  const A4 = 440;
  const A4Index = 57;
  
  const semitones = 12 * Math.log2(frequency / A4);
  const midiNote = A4Index + semitones;
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor((midiNote + 8) / 12);
  const noteIndex = Math.floor((midiNote % 12) + 12) % 12;
  const cents = Math.round((semitones - Math.floor(semitones)) * 100);
  
  return {
    note: noteNames[noteIndex],
    octave,
    cents
  };
}

// GLB 모델 컴포넌트
function SpeakerModel({ isActive, intensity, color }: { isActive: boolean; intensity: number; color: string }) {
  const { scene } = useGLTF('/models/speaker1.glb');
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      // 강도에 따른 스케일 변화만
      const scale = 1 + (intensity * 0.3);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={meshRef} rotation={[0, -Math.PI / 4, 0]}>
      <primitive object={scene.clone()} scale={[3.5, 3.5, 3.5]} position={[0, 0, 0]} />
    </group>
  );
}

const PitchGraph: React.FC<PitchGraphProps> = ({ isRecording }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.3;
      
      const bufferLength = analyser.fftSize / 2;
      const dataArray = new Float32Array(bufferLength);
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      setIsActive(true);
      
      const analyzePitch = () => {
        if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        const pitch = detectPitch(dataArrayRef.current, audioContextRef.current.sampleRate);
        
        if (pitch) {
          setCurrentPitch(pitch);
        }
        
        animationFrameRef.current = requestAnimationFrame(analyzePitch);
      };
      
      analyzePitch();
      
    } catch (error) {
      console.error('마이크 접근 실패:', error);
      setIsActive(false);
    }
  }, []);

  const cleanupResources = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
          audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (isRecording) {
      startMicrophone();
    } else {
      cleanupResources();
      setCurrentPitch(null);
    }
    
    return () => {
      cleanupResources();
    };
  }, [isRecording, startMicrophone, cleanupResources]);

  const pitchIntensity = currentPitch ? Math.min(1, currentPitch.frequency / 400) : 0;
  const sphereColor = currentPitch ? 
    (currentPitch.frequency > 300 ? '#ff0080' : 
     currentPitch.frequency > 200 ? '#ff4081' : 
     currentPitch.frequency > 100 ? '#00ffff' : '#00ff00') : '#333';

  return (
    <div style={{
      height: '100%',
      width: '100%',
      position: 'relative',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      overflow: 'visible'
    }}>
      {/* GLB 모델 - 중앙 배치 */}
      <div style={{
        position: 'fixed', // fixed로 변경하여 최상위 레이어
        top: '50%', // 원래 위치로 복원
        left: '50%',
        width: '100%',
        height: '100%',
        transform: `translate(-50%, -50%) scale(${1 + pitchIntensity * 0.6})`,
        transition: 'transform 0.3s ease',
        zIndex: 9999, // 최상위 레이어
        pointerEvents: 'none' // 마우스 이벤트 차단하지 않음
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000', 0);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 5, 5]} intensity={2.0} castShadow />
          <pointLight position={[-5, 5, 5]} color="#00ffff" intensity={1.5} />
          <pointLight position={[5, -5, 5]} color="#ff0080" intensity={1.5} />
          <pointLight position={[0, 0, 5]} color="#ffff00" intensity={1.0} />
          <pointLight position={[-3, -3, 3]} color="#ff00ff" intensity={0.8} />
          <pointLight position={[3, 3, 3]} color="#00ff00" intensity={0.8} />
          
          <SpeakerModel 
            isActive={isActive}
            intensity={pitchIntensity}
            color={sphereColor}
          />
          
          <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
      
      {/* 피치 정보 - div 카드 아래쪽 */}
      <div style={{
        position: 'absolute',
        top: '120%', // div 카드 아래쪽
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #00ffff',
        borderRadius: '15px',
        padding: '20px',
        zIndex: 10000,
        minWidth: '300px',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
        marginTop: '20px'
      }}>
        {currentPitch ? (
          <>
            <div style={{
              fontSize: '2.5rem',
            fontWeight: 'bold', 
              color: sphereColor,
              textShadow: `0 0 20px ${sphereColor}`,
              fontFamily: 'monospace',
              marginBottom: '10px'
          }}>
            {currentPitch.note}{currentPitch.octave}
            </div>
            <div style={{
              fontSize: '1.2rem',
              color: '#00ff00',
              textShadow: '0 0 10px #00ff00',
              fontFamily: 'monospace',
              marginBottom: '5px'
            }}>
            {Math.round(currentPitch.frequency)}Hz
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#00ffff',
              fontFamily: 'monospace'
            }}>
              PITCH DETECTED
            </div>
          </>
        ) : (
          <div style={{
            fontSize: '1.2rem',
            color: '#666',
            fontFamily: 'monospace'
          }}>
            {isActive ? 'WAITING FOR PITCH...' : 'MICROPHONE STANDBY'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PitchGraph;