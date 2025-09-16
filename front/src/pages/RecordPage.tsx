/**
 * RecordPage - 사이버펑크 스타일 녹음 스튜디오 페이지 (순수 HTML/CSS)
 * 
 * 주요 기능:
 * - MR/가사 카드 뒤집기 시스템으로 공간 효율성 극대화
 * - 곡 검색 및 예약 큐 관리
 * - 실시간 녹음 컨트롤 및 음성 분석
 * - ReservationProvider로 예약 큐 상태를 전역 관리
 * - 반응형 Grid 레이아웃으로 최적화된 플로우
 */

import React, { useState, useEffect } from 'react';
import SongSearchPanel from '../components/record/SongSearchPanel';
import ReservationQueue from '../components/record/ReservationQueue';
import MRLyricsCard from '../components/record/MRLyricsCard';
import RecordingControls from '../components/record/RecordingControls';
import PitchGraph from '../components/record/PitchGraph';
import VolumeVisualizer from '../components/record/VolumeVisualizer';
import { ReservationProvider } from '../contexts/ReservationContext';
import { CyberGrid, HologramCorners } from '../components/common/CyberpunkEffects';

const RecordPage: React.FC = () => {
  // 녹음 상태 관리
  const [isRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // MR/가사 카드 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3분
  const [volume, setVolume] = useState(0.7);
  const [currentSong] = useState({
    id: '1',
    title: 'NEURAL DANCE',
    artist: 'CYBER COLLECTIVE',
    genre: 'Cyberpunk',
    duration: '3:00'
  });

  // 컴포넌트 마운트 시 애니메이션 시작
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 시간 업데이트 시뮬레이션
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  // 플레이어 컨트롤 함수들
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  return (
    // 예약 큐 상태를 전역으로 관리하는 Provider
    <ReservationProvider>
      <div style={{ 
        flex: 1, 
        paddingTop: '80px', // 녹음 페이지는 헤더 높이를 고려해 더 큰 padding-top 적용
        background: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
        minHeight: '100vh',
        position: 'relative',
        overflow: 'auto'
      }}>
        {/* 배경 그리드 패턴 */}
        <CyberGrid size={50} opacity={0.3} color="rgba(0, 255, 255, 0.1)" />

        {/* 홀로그램 오버레이 효과 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 255, 0.03) 2px,
              rgba(0, 255, 255, 0.03) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 0, 128, 0.03) 2px,
              rgba(255, 0, 128, 0.03) 4px
            )
          `,
          backgroundSize: '100px 100px',
          zIndex: 1
        }} />

        <div style={{ 
          padding: '16px',
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          opacity: isInitialized ? 1 : 0,
          transform: isInitialized ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* 페이지 제목 - 홀로그램 스타일 */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '16px',
            position: 'relative'
          }}>
            <h1 style={{ 
              fontWeight: 900,
              fontSize: window.innerWidth < 768 ? '1.8rem' : window.innerWidth < 1024 ? '2.5rem' : '3rem',
              background: 'linear-gradient(45deg, #00ffff 0%, #ff0080 50%, #00ff00 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
              letterSpacing: '0.1em',
              margin: '0 0 8px 0'
            }}>
              CYBER STUDIO
            </h1>
            
            <p style={{ 
              color: '#00ffff',
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0.8,
              fontSize: '0.9rem',
              margin: 0
            }}>
              NEURAL RECORDING INTERFACE
            </p>

            {/* 홀로그램 라인 효과 */}
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '150px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
              boxShadow: '0 0 10px #00ffff'
            }} />
          </div>
          
          {/* 새로운 div 레이아웃: 카드 뒤집기 시스템 */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr 1fr',
            gap: '24px',
            position: 'relative'
          }}>
            {/* 왼쪽: 검색 및 예약 큐 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {/* 곡 검색 패널 */}
               <div style={{ 
                 background: `
                   linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%),
                   rgba(26, 26, 26, 0.95)
                 `,
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(0, 255, 255, 0.3)',
                 borderRadius: '16px',
                 padding: '16px',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                 position: 'relative',
                 overflow: 'visible',
                 minHeight: '450px',
                 opacity: isInitialized ? 1 : 0,
                 transform: isInitialized ? 'translateX(0)' : 'translateX(-30px)',
                 transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
               }}>
                 <HologramCorners />
                 <SongSearchPanel />
               </div>

              {/* 예약 큐 패널 */}
              <div style={{ 
                background: `
                  linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(0, 255, 0, 0.1) 100%),
                  rgba(26, 26, 26, 0.95)
                `,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 0, 128, 0.3)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '500px',
                opacity: isInitialized ? 1 : 0,
                transform: isInitialized ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
              }}>
                <HologramCorners />
                <ReservationQueue />
              </div>
            </div>

            {/* 중앙: MR/가사 카드 */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              opacity: isInitialized ? 1 : 0,
              transform: isInitialized ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
            }}>
              <MRLyricsCard
                currentSong={currentSong}
                onPlayPause={handlePlayPause}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                onVolumeChange={handleVolumeChange}
              />
              
              {/* 녹음 컨트롤 */}
              <div style={{ 
                background: `
                  linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%),
                  rgba(26, 26, 26, 0.95)
                `,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isRecording && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                    borderRadius: '18px',
                    zIndex: -1,
                    filter: 'blur(8px)',
                    opacity: 0.6
                  }} />
                )}
                
                <RecordingControls />
              </div>
            </div>

            {/* 오른쪽: 분석 도구 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 피치 분석 그래프 */}
              <div style={{ 
                background: `
                  linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%),
                  rgba(26, 26, 26, 0.95)
                `,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '350px',
                opacity: isInitialized ? 1 : 0,
                transform: isInitialized ? 'translateX(0)' : 'translateX(30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
              }}>
                <PitchGraph isRecording={isRecording} />
              </div>

              {/* 볼륨 시각화 */}
              <div style={{ 
                background: `
                  linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(0, 255, 0, 0.1) 100%),
                  rgba(26, 26, 26, 0.95)
                `,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 0, 128, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '350px',
                opacity: isInitialized ? 1 : 0,
                transform: isInitialized ? 'translateX(0)' : 'translateX(30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
              }}>
                <VolumeVisualizer isRecording={isRecording} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReservationProvider>
  );
};

export default RecordPage;