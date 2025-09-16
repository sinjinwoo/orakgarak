/**
 * RecordPage - 마이크 상태에 따른 동적 레이아웃
 * 마이크 활성화 시: 스피커-가사-스피커
 * 마이크 비활성화 시: 노래검색-MR-예약
 */

import React, { useState, useEffect } from 'react';
import SongSearchPanel from '../components/record/SongSearchPanel';
import ReservationQueue from '../components/record/ReservationQueue';
import MRLyricsCard from '../components/record/MRLyricsCard';
import RecordingControls from '../components/record/RecordingControls';
import PitchGraph from '../components/record/PitchGraph';
import VolumeVisualizer from '../components/record/VolumeVisualizer';
import { ReservationProvider } from '../contexts/ReservationContext';
import { useReservation } from '../hooks/useReservation';

const RecordPageContent: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180);
  const [volume, setVolume] = useState(0.7);
  
  const { currentPlayingSong, isPlaying, setPlayingState } = useReservation();

  // 녹음 상태 변경 핸들러
  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setPlayingState(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration, setPlayingState]);

  const handlePlayPause = () => {
    setPlayingState(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* 메인 컨테이너 */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        
        {/* 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}>
            CYBER STUDIO
          </h1>
          <p style={{
            color: '#00ffff',
            fontSize: '1rem',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            NEURAL RECORDING INTERFACE
          </p>
        </div>

        {/* 3컬럼 그리드 레이아웃 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          alignItems: 'start',
          overflow: 'visible' // 스피커가 카드 밖으로 나올 수 있도록
        }}>
          
          {/* 왼쪽 컬럼: 마이크 상태에 따라 다른 컴포넌트 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '500px',
              perspective: '1000px'
            }}>
              {/* 카드 컨테이너 */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-in-out',
                transform: isRecording ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: 'pointer'
              }}>
                
                {/* 앞면: 노래 검색 패널 */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  zIndex: 10 // 카드 레이어 (스피커보다 낮게)
                }}>
                  <SongSearchPanel />
                  <div style={{
                    textAlign: 'center',
                    padding: '10px',
                    color: '#00ffff',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    🎵 노래 검색
                  </div>
                </div>
                
                {/* 뒷면: 피치 스피커 */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #00ffff',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
                  overflow: 'visible', // 스피커가 카드 밖으로 나올 수 있도록
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  zIndex: 10 // 카드 레이어 (스피커보다 낮게)
                }}>
                  <PitchGraph isRecording={isRecording} />
                  <div style={{
                    textAlign: 'center',
                    padding: '10px',
                    color: '#00ffff',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    🎤 피치 분석
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 중앙 컬럼: MR/가사 카드 및 녹음 컨트롤 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            
            {/* MR/가사 카드 */}
            <div style={{
              background: 'rgba(26, 26, 26, 0.9)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '15px',
              padding: '20px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              height: '460px',
              overflow: 'hidden'
            }}>
              <MRLyricsCard
                currentSong={currentPlayingSong ? {
                  id: currentPlayingSong.id.toString(),
                  title: currentPlayingSong.title,
                  artist: currentPlayingSong.artist,
                  genre: currentPlayingSong.genre,
                  duration: currentPlayingSong.duration
                } : {
                  id: '1',
                  title: 'NEURAL DANCE',
                  artist: 'CYBER COLLECTIVE',
                  genre: 'Cyberpunk',
                  duration: '3:00'
                }}
                onPlayPause={handlePlayPause}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                onVolumeChange={handleVolumeChange}
              />
            </div>
            
            {/* 녹음 컨트롤 - 사이버펑크 마이크 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px'
            }}>
              <RecordingControls onRecordingChange={handleRecordingChange} />
            </div>
          </div>

          {/* 오른쪽 컬럼: 마이크 상태에 따라 다른 컴포넌트 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '500px',
              perspective: '1000px'
            }}>
              {/* 카드 컨테이너 */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-in-out',
                transform: isRecording ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: 'pointer'
              }}>
                
                {/* 앞면: 예약 큐 */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '1px solid rgba(255, 0, 128, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  zIndex: 10 // 카드 레이어 (스피커보다 낮게)
                }}>
                  <ReservationQueue />
                  <div style={{
                    textAlign: 'center',
                    padding: '10px',
                    color: '#ff0080',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    📋 예약 큐
                  </div>
                </div>
                
                {/* 뒷면: 볼륨 스피커 */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #ff0080',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 0 30px rgba(255, 0, 128, 0.4)',
                  overflow: 'visible', // 스피커가 카드 밖으로 나올 수 있도록
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  zIndex: 10 // 카드 레이어 (스피커보다 낮게)
                }}>
                  <VolumeVisualizer isRecording={isRecording} />
                  <div style={{
                    textAlign: 'center',
                    padding: '10px',
                    color: '#ff0080',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    🔊 볼륨 분석
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecordPage: React.FC = () => {
  return (
    <ReservationProvider>
      <RecordPageContent />
    </ReservationProvider>
  );
};

export default RecordPage;