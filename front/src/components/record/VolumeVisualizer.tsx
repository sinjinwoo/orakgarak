import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface VolumeVisualizerProps {
  isRecording: boolean;
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
    <group ref={meshRef} rotation={[0, -Math.PI / 1.4, 0]}>
      <primitive object={scene.clone()} scale={[3.5, 3.5, 3.5]} position={[0, 0, 0]} />
    </group>
  );
}

const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({ isRecording }) => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  
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
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      setIsActive(true);
      
      const analyzeVolume = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        // 시간 도메인 데이터 사용 (더 정확한 볼륨 측정)
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        
        // RMS 계산으로 볼륨 측정
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += Math.pow(dataArrayRef.current[i], 2);
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        const volumePercent = Math.min(100, Math.max(0, rms * 1000)); // 더 민감한 볼륨 감지
        
        setVolume(volumePercent);
        animationFrameRef.current = requestAnimationFrame(analyzeVolume);
      };
      
      analyzeVolume();
      
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
      setVolume(0);
    }
    
    return () => {
      cleanupResources();
    };
  }, [isRecording, startMicrophone, cleanupResources]);

  const volumeIntensity = volume / 100;
  const getColorPalette = (vol: number) => {
    if (vol > 80) return '#ff0080';
    if (vol > 60) return '#ff4081';
    if (vol > 40) return '#ffff00';
    if (vol > 20) return '#00ffff';
    return '#00ff00';
  };
  const sphereColor = getColorPalette(volume);

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
        transform: `translate(-50%, -50%) scale(${1 + volumeIntensity * 0.6})`,
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
            intensity={volumeIntensity}
            color={sphereColor}
          />
          
          <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
      
      {/* 볼륨 정보 - div 카드 아래쪽 */}
      <div style={{
        position: 'absolute',
        top: '120%', // div 카드 아래쪽
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #ff0080',
        borderRadius: '15px',
        padding: '20px',
        zIndex: 10000,
        minWidth: '300px',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(255, 0, 128, 0.5)',
        marginTop: '20px'
      }}>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: sphereColor,
          textShadow: `0 0 20px ${sphereColor}`,
          fontFamily: 'monospace',
          marginBottom: '10px'
        }}>
          {Math.round(volume)}%
        </div>
        <div style={{
          fontSize: '1.2rem',
          color: '#00ff00',
          textShadow: '0 0 10px #00ff00',
          fontFamily: 'monospace',
          marginBottom: '5px'
        }}>
          VOLUME LEVEL
        </div>
        <div style={{
          fontSize: '0.9rem',
          color: '#ff0080',
          fontFamily: 'monospace'
        }}>
          {isActive ? 'VOLUME DETECTED' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
};

export default VolumeVisualizer;