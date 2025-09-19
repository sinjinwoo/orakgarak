import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface VolumeVisualizerProps {
  isRecording: boolean;
}

// GLB 모델 컴포넌트
function SpeakerModel({ intensity }: { intensity: number }) {
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
  // isActive 상태 제거 (UI에 미사용)
  const [, setIsActive] = useState(false);
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
      
      const AudioContextCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      const audioContext = new (AudioContextCtor as typeof AudioContext)();
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
  // getColorPalette 제거 (미사용)
  // 색상은 현재 화면 표시 요소에 사용하지 않으므로 계산 생략

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
        width: '150%', // Canvas 크기 확대 (스피커 잘림 방지)
        height: '150%', // Canvas 크기 확대 (스피커 잘림 방지)
        transform: `translate(-50%, -50%) scale(${Math.min(1 + volumeIntensity * 0.6, 1.8)})`, // 최대 스케일 제한
        transition: 'transform 0.3s ease',
        zIndex: 9999, // 최상위 레이어
        pointerEvents: 'none' // 마우스 이벤트 차단하지 않음
      }}>
        <Canvas
          camera={{ 
            position: [0, 0, 6], // 카메라를 더 뒤로 이동
            fov: 75 // 시야각 확대
          }}
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
            intensity={volumeIntensity}
          />
          
          <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
      
      {/* 3D 파티클 및 텍스트 정보 숨김 */}
      <div style={{ display: 'none' }} />
    </div>
  );
};

export default VolumeVisualizer;