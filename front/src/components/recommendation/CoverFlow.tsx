import React, { useState, useEffect, useCallback } from 'react';
import SongCard from './SongCard';
import type { RecommendedSong } from '../../types/recommendation';

interface CoverFlowProps {
  songs: RecommendedSong[];
  selectedSong?: RecommendedSong;
  onSongSelect?: (song: RecommendedSong) => void;
  isOpen?: boolean;
  onClose?: () => void;
  userFeedback?: { [songId: string]: 'like' | 'dislike' | null };
  onSongFeedback?: (songId: string, feedback: 'like' | 'dislike') => void;
  showMRButton?: boolean;
  onReservation?: (song: RecommendedSong) => void;
  showDislike?: boolean;
}

const CoverFlow: React.FC<CoverFlowProps> = ({
  songs,
  selectedSong,
  onSongSelect,
  isOpen = true,
  onClose,
  userFeedback = {},
  onSongFeedback,
  showMRButton = true,
  onReservation,
  showDislike = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 선택된 곡이 변경되면 해당 인덱스로 이동
  useEffect(() => {
    if (selectedSong) {
      const index = songs.findIndex(song => song.id === selectedSong.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [selectedSong, songs]);

  // 이전 곡으로 이동
  const goToPrevious = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, songs.length]);

  // 다음 곡으로 이동
  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev + 1) % songs.length);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, songs.length]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnimating, goToPrevious, goToNext]);

  if (songs.length === 0) return null;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '550px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 50,
            width: '48px',
            height: '48px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
          }}
        >
          ×
        </button>
      )}
      {/* 커버플로우 컨테이너 */}
      <div 
        style={{
          position: 'relative',
          height: '420px',
          width: '85%',
          margin: '0 auto',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '16px',
          zIndex: 10,
          perspective: '1000px',
          perspectiveOrigin: 'center center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* 카드들 */}
        {songs.map((song, index) => {
          const distance = index - currentIndex;
          const absDistance = Math.abs(distance);
          
          // 카드 위치와 회전 계산 - 통일된 크기 (240x300)
          const getCardTransform = () => {
            if (distance === 0) {
              // 중앙 카드 - 크기 완전 통일
              return 'translateX(0px) translateY(0px) translateZ(120px) rotateY(0deg) scale(1.0)';
            }
            
            // 좌우 대칭 배치를 위한 계산 - 새로운 카드 크기 고려
            const angle = distance * 15; // 각 카드당 15도 회전
            const offsetX = distance * 140; // X축 오프셋 (카드 폭 240 고려)
            const offsetZ = -absDistance * 80; // Z축 깊이
            const offsetY = absDistance * 15; // Y축 오프셋
            
            // 모든 카드 크기 완전 통일 (scale 강제 고정)
            return `translateX(${offsetX}px) translateY(${offsetY}px) translateZ(${offsetZ}px) rotateY(${angle}deg) scale(0.85)`;
          };
          
          // 카드 투명도 계산
          const getCardOpacity = () => {
            if (distance === 0) return 1;
            if (absDistance === 1) return 0.8;
            if (absDistance === 2) return 0.6;
            if (absDistance === 3) return 0.4;
            return 0.2;
          };
          
          // 카드 z-index 계산
          const getCardZIndex = () => {
            if (distance === 0) return 1000;
            return 1000 - absDistance * 100;
          };

          // 표시할 카드 범위 제한
          if (absDistance > 4) return null;

          return (
            <div
              key={song.id}
              className="absolute cursor-pointer transition-all duration-700 ease-out hover:brightness-125 z-30"
              style={{
                transform: getCardTransform(),
                opacity: getCardOpacity(),
                zIndex: getCardZIndex(),
                transformStyle: 'preserve-3d',
                filter: distance === 0 ? 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.4))' : 'none',
                // 강제 크기 고정
                width: '240px',
                height: '300px',
                maxWidth: '240px',
                maxHeight: '300px',
                minWidth: '240px',
                minHeight: '300px'
              }}
              onMouseEnter={(e) => {
                if (distance !== 0) {
                  e.currentTarget.style.transform = `${getCardTransform()} translateY(-20px)`;
                  e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 15px 30px rgba(139, 92, 246, 0.3))';
                }
              }}
              onMouseLeave={(e) => {
                if (distance !== 0) {
                  e.currentTarget.style.transform = getCardTransform();
                  e.currentTarget.style.filter = 'none';
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (distance !== 0) {
                  setCurrentIndex(index);
                }
                onSongSelect?.(song);
              }}
            >
              <SongCard
                song={song}
                isSelected={distance === 0}
                onSelect={onSongSelect}
                onReservation={onReservation}
                showDislike={showDislike}
              />
            </div>
          );
        })}
      </div>


      {/* 사이버펑크 스타일 원형 컨트롤러 */}
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50
      }}>
        <div style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          background: 'linear-gradient(135deg, rgba(30, 10, 20, 0.9) 0%, rgba(10, 5, 15, 0.9) 100%)',
          borderRadius: '50%',
          border: '3px solid rgba(251, 66, 212, 0.6)',
          boxShadow: '0 0 30px rgba(251, 66, 212, 0.3), 0 20px 50px rgba(0, 0, 0, 0.6)',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          {/* 중앙 재생 버튼 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(66, 253, 235, 0.8) 0%, rgba(251, 66, 212, 0.8) 100%)',
            borderRadius: '50%',
            border: '3px solid rgba(66, 253, 235, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(66, 253, 235, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(66, 253, 235, 1) 0%, rgba(251, 66, 212, 1) 100%)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(66, 253, 235, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(66, 253, 235, 0.8) 0%, rgba(251, 66, 212, 0.8) 100%)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(66, 253, 235, 0.4)';
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, rgba(251, 66, 212, 0.9) 0%, rgba(66, 253, 235, 0.9) 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(251, 66, 212, 0.5)'
            }}>
              <span style={{ 
                color: '#000', 
                fontSize: '24px', 
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
              }}>♪</span>
            </div>
          </div>
          
          {/* 회전 감지 영역 */}
          <div 
            style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              right: '15px',
              bottom: '15px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              let lastAngle = 0;
              let hasMoved = false;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                const deltaX = moveEvent.clientX - centerX;
                const deltaY = moveEvent.clientY - centerY;
                const currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                
                if (!hasMoved) {
                  lastAngle = currentAngle;
                  hasMoved = true;
                  return;
                }
                
                // 각도 차이 계산
                let angleDiff = currentAngle - lastAngle;
                if (angleDiff > 180) angleDiff -= 360;
                if (angleDiff < -180) angleDiff += 360;
                
                // 최소 회전 각도 (30도 이상 회전해야 반응)
                if (Math.abs(angleDiff) > 30) {
                  if (angleDiff > 0) {
                    // 시계방향 회전 - 다음 곡
                    goToNext();
                  } else {
                    // 반시계방향 회전 - 이전 곡
                    goToPrevious();
                  }
                  lastAngle = currentAngle;
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CoverFlow;