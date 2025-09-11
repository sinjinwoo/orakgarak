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
}

const CoverFlow: React.FC<CoverFlowProps> = ({
  songs,
  selectedSong,
  onSongSelect,
  isOpen = true,
  onClose,
  userFeedback = {},
  onSongFeedback
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
    <div className="relative w-full h-[800px]">
      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
            border: '2px solid #4b5563',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
          }}
        >
          <span className="text-lg font-bold">×</span>
        </button>
      )}
      {/* 커버플로우 컨테이너 */}
      <div 
        className="relative h-[700px] w-[80%] mx-auto overflow-hidden flex justify-center items-center rounded-2xl z-10"
        style={{
          perspective: '1200px',
          perspectiveOrigin: 'center center',
          background: `
            radial-gradient(ellipse at center, rgba(139, 92, 246, 0.05) 0%, transparent 70%),
            radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(34, 197, 94, 0.03) 0%, transparent 50%)
          `
        }}
      >
        {/* 카드들 */}
        {songs.map((song, index) => {
          const distance = index - currentIndex;
          const absDistance = Math.abs(distance);
          
          // 카드 위치와 회전 계산 - 중앙 기준으로 대칭 배치
          const getCardTransform = () => {
            if (distance === 0) {
              // 중앙 카드
              return 'translateX(0px) translateY(0px) translateZ(120px) rotateY(0deg) scale(1.1)';
            }
            
            // 좌우 대칭 배치를 위한 계산
            const angle = distance * 20; // 각 카드당 20도 회전
            const offsetX = distance * 120; // X축 오프셋을 줄임
            const offsetZ = -absDistance * 60; // Z축 깊이를 줄임
            const offsetY = absDistance * 10; // Y축 오프셋을 줄임
            const scale = Math.max(0.5, 1.1 - absDistance * 0.15);
            
            return `translateX(${offsetX}px) translateY(${offsetY}px) translateZ(${offsetZ}px) rotateY(${angle}deg) scale(${scale})`;
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
                filter: distance === 0 ? 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.4))' : 'none'
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
                isBookmarked={false}
                onSelect={onSongSelect}
                onBookmark={() => {}}
                userFeedback={userFeedback[song.id]}
                onFeedback={onSongFeedback}
              />
            </div>
          );
        })}
      </div>


      {/* 아이팟 스타일 원형 컨트롤러 */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50
      }}>
        <div style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          borderRadius: '50%',
          border: '5px solid #4a5568',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          cursor: 'pointer'
        }}>
          {/* 중앙 재생 버튼 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
            borderRadius: '50%',
            border: '4px solid #718096',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)';
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>♪</span>
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