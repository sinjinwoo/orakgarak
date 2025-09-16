import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

// 홀로그램 스캔 라인 효과
export const HologramScanLine: React.FC<{ 
  speed?: number; 
  color?: string; 
  height?: number;
}> = ({ 
  speed = 3, 
  color = 'rgba(0, 255, 255, 0.3)', 
  height = 2 
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation: `hologramScan ${speed}s linear infinite`,
        '@keyframes hologramScan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }}
    />
  );
};

// 네온 파티클 효과
export const NeonParticles: React.FC<{ 
  count?: number; 
  color?: string;
}> = ({ count = 20, color = '#00ffff' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // 파티클 초기화
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        // 파티클 이동
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 경계 체크
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // 파티클 그리기
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // 정리
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={200}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

// 사이버 그리드 배경
export const CyberGrid: React.FC<{ 
  size?: number; 
  opacity?: number;
  color?: string;
}> = ({ 
  size = 50, 
  opacity = 0.3, 
  color = 'rgba(0, 255, 255, 0.1)' 
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        opacity,
        animation: 'cyberGrid 20s linear infinite',
        '@keyframes cyberGrid': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: `${size}px ${size}px` }
        },
        zIndex: 0
      }}
    />
  );
};

// 네온 글로우 텍스트
export const NeonGlowText: React.FC<{
  children: React.ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}> = ({ children, color = '#00ffff', intensity = 'medium' }) => {
  const getGlowIntensity = () => {
    switch (intensity) {
      case 'low': return '0 0 5px, 0 0 10px';
      case 'medium': return '0 0 5px, 0 0 10px, 0 0 15px';
      case 'high': return '0 0 5px, 0 0 10px, 0 0 15px, 0 0 20px';
      default: return '0 0 5px, 0 0 10px, 0 0 15px';
    }
  };

  return (
    <Box
      sx={{
        color,
        textShadow: getGlowIntensity().split(',').map(glow => `${glow.trim()} ${color}`).join(', '),
        animation: 'neonGlow 2s ease-in-out infinite alternate',
        '@keyframes neonGlow': {
          '0%, 100%': {
            textShadow: getGlowIntensity().split(',').map(glow => `${glow.trim()} ${color}`).join(', ')
          },
          '50%': {
            textShadow: getGlowIntensity().split(',').map(glow => {
              const trimmed = glow.trim();
              const reduced = trimmed.replace(/\d+/g, (match) => (parseInt(match) / 2).toString());
              return `${reduced} ${color}`;
            }).join(', ')
          }
        }
      }}
    >
      {children}
    </Box>
  );
};

// 홀로그램 코너 효과
export const HologramCorners: React.FC<{
  topLeft?: boolean;
  topRight?: boolean;
  bottomLeft?: boolean;
  bottomRight?: boolean;
  color?: string;
}> = ({ 
  topLeft = true, 
  topRight = false, 
  bottomLeft = false, 
  bottomRight = true,
  color = '#00ffff'
}) => {
  return (
    <>
      {topLeft && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40px',
            height: '40px',
            borderTop: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
            borderRadius: '16px 0 0 0',
            boxShadow: `0 0 10px ${color}`
          }}
        />
      )}
      {topRight && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40px',
            height: '40px',
            borderTop: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
            borderRadius: '0 16px 0 0',
            boxShadow: `0 0 10px ${color}`
          }}
        />
      )}
      {bottomLeft && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '40px',
            height: '40px',
            borderBottom: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
            borderRadius: '0 0 0 16px',
            boxShadow: `0 0 10px ${color}`
          }}
        />
      )}
      {bottomRight && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '40px',
            height: '40px',
            borderBottom: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
            borderRadius: '0 0 16px 0',
            boxShadow: `0 0 10px ${color}`
          }}
        />
      )}
    </>
  );
};

// 사이버펑크 로딩 스피너
export const CyberpunkSpinner: React.FC<{
  size?: number;
  color?: string;
  speed?: number;
}> = ({ size = 40, color = '#00ffff', speed = 1 }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        border: `4px solid ${color}20`,
        borderTop: `4px solid ${color}`,
        borderRadius: '50%',
        animation: `spin ${speed}s linear infinite`,
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        boxShadow: `0 0 20px ${color}50`
      }}
    />
  );
};

// 데이터 스트림 효과
export const DataStream: React.FC<{
  width?: number;
  height?: number;
  speed?: number;
  color?: string;
}> = ({ width = 100, height = 200, speed = 2, color = '#00ffff' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const characters = '01';
    const fontSize = 14;
    const columns = width / fontSize;
    const drops: number[] = [];

    // 초기화
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, speed * 50);
    return () => clearInterval(interval);
  }, [width, height, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.3
      }}
    />
  );
};
