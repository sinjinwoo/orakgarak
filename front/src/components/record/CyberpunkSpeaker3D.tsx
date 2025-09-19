import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface CyberpunkSpeaker3DProps {
  isActive: boolean;
  intensity: number; // 0-1
  color: string;
  type: 'pitch' | 'volume';
  modelPath?: string; // GLB 파일 경로
}

// DefaultSpeaker 컴포넌트 제거됨 - GLB 모델만 사용

// GLB 모델 컴포넌트
function SpeakerModel({
  isActive,
  intensity,
  color,
  modelPath
}: {
  isActive: boolean;
  intensity: number;
  color: string;
  modelPath?: string;
}) {
  try {
    const { scene } = useGLTF(modelPath || '/models/speaker12.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
      if (meshRef.current) {
        // 진동 효과
        if (isActive) {
          meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 20) * 0.02;
          meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 15) * 0.02;
        }

        // 강도에 따른 스케일 변화
        const scale = 1 + (intensity * 0.2);
        meshRef.current.scale.setScalar(scale);
      }
    });

    return (
      <group ref={meshRef}>
        {/* 네온 후광 효과 */}
        <primitive 
          object={clonedScene} 
          scale={[3.5, 3.5, 3.5]}
          position={[0, 0, 0]}
        />
        
        {/* 네온 후광 1 - 큰 링 */}
        <Torus args={[4, 0.1, 16, 100]} position={[0, 0, -1]}>
          <meshBasicMaterial 
            color={isActive ? color : "#ff0080"}
            transparent={true}
            opacity={isActive ? 0.8 : 0.3}
          />
        </Torus>
        
        {/* 네온 후광 2 - 중간 링 */}
        <Torus args={[3, 0.08, 16, 100]} position={[0, 0, -0.5]}>
          <meshBasicMaterial 
            color={isActive ? "#00ffff" : "#00ff00"}
            transparent={true}
            opacity={isActive ? 0.6 : 0.2}
          />
        </Torus>
        
        {/* 네온 후광 3 - 작은 링 */}
        <Torus args={[2, 0.05, 16, 100]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            color={isActive ? "#ffff00" : "#ff00ff"}
            transparent={true}
            opacity={isActive ? 0.4 : 0.1}
          />
        </Torus>
        
        {/* 글로우 효과 - 구체 */}
        <Sphere args={[0.5, 32, 32]} position={[0, 0, 1]}>
          <meshBasicMaterial 
            color={isActive ? color : "#ffffff"}
            transparent={true}
            opacity={isActive ? 0.3 : 0.1}
          />
        </Sphere>
        
        {/* 뒷면 후광 효과 */}
        <Torus args={[5, 0.15, 16, 100]} position={[0, 0, -2]}>
          <meshBasicMaterial 
            color={isActive ? "#ff0080" : "#ff00ff"}
            transparent={true}
            opacity={isActive ? 0.4 : 0.1}
          />
        </Torus>
        
        <Torus args={[6, 0.2, 16, 100]} position={[0, 0, -3]}>
          <meshBasicMaterial 
            color={isActive ? "#00ffff" : "#00ff00"}
            transparent={true}
            opacity={isActive ? 0.2 : 0.05}
          />
        </Torus>
      </group>
    );
  } catch (error) {
    console.error('GLB 모델 로딩 실패:', error);
    // 기본 큐브로 fallback
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={isActive ? color : "#333333"}
          emissive={isActive ? color : "#000000"}
          emissiveIntensity={isActive ? intensity * 0.5 : 0}
        />
      </mesh>
    );
  }
}

// 메인 스피커 컴포넌트 (GLB 모델만 사용)
function MainSpeaker({ 
  isActive, 
  intensity, 
  color, 
  modelPath 
}: { 
  isActive: boolean; 
  intensity: number; 
  color: string; 
  modelPath?: string;
}) {
  return (
    <group>
      {/* GLB 모델 */}
      <SpeakerModel
        isActive={isActive}
        intensity={intensity}
        color={color}
        modelPath={modelPath}
      />
    </group>
  );
}

// FrontPanel 컴포넌트 제거됨 - GLB 모델만 사용

// 메인 3D 스피커 컴포넌트
function CyberpunkSpeaker3D({ isActive, intensity, color, type, modelPath }: CyberpunkSpeaker3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      // 전체적인 미세한 회전
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <MainSpeaker 
        isActive={isActive} 
        intensity={intensity} 
        color={color} 
        modelPath={modelPath}
      />
    </group>
  );
}

// GLB 모델 사용 (speaker1.glb)

// 메인 컴포넌트
const CyberpunkSpeaker3DWrapper: React.FC<CyberpunkSpeaker3DProps> = (props) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      position: 'relative',
      overflow: 'visible' // 모델이 밖으로 나올 수 있도록
    }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true, 
          alpha: true, // 투명 배경 허용
          powerPreference: "high-performance" 
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0); // 투명 배경
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* 조명 */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} castShadow />
        <pointLight position={[-4, 4, 4]} color="#00ffff" intensity={2.0} />
        <pointLight position={[4, -4, 4]} color="#ff0080" intensity={2.0} />
        <pointLight position={[0, 0, 5]} color="#ffff00" intensity={1.5} />
        <pointLight position={[-2, -2, 3]} color="#ff00ff" intensity={1.0} />
        <pointLight position={[2, 2, 3]} color="#00ff00" intensity={1.0} />

        {/* 3D 스피커 */}
        <CyberpunkSpeaker3D {...props} />

        {/* 오빗 컨트롤 (마우스로 회전/줌) */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default CyberpunkSpeaker3DWrapper;
