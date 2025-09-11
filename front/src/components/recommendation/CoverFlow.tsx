import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SongCard from './SongCard';
import type { RecommendedSong } from '../../types/recommendation';

interface CoverFlowProps {
  songs: RecommendedSong[];
  selectedSong?: RecommendedSong;
  onSongSelect?: (song: RecommendedSong) => void;
}

const CoverFlow: React.FC<CoverFlowProps> = ({
  songs,
  selectedSong,
  onSongSelect
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

  return (
    <div className="relative w-full h-[700px]">
      {/* 커버플로우 컨테이너 */}
      <div 
        className="relative h-[600px] overflow-hidden flex justify-center items-center rounded-3xl"
        style={{
          perspective: '1500px',
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
              return 'translateX(0px) translateY(0px) translateZ(200px) rotateY(0deg) scale(1.2)';
            }
            
            // 좌우 대칭 배치를 위한 계산
            const angle = distance * 25; // 각 카드당 25도 회전
            const offsetX = distance * 180; // X축 오프셋을 더 명확하게
            const offsetZ = -absDistance * 80; // Z축 깊이
            const offsetY = absDistance * 15; // 약간의 Y축 오프셋
            const scale = Math.max(0.6, 1.2 - absDistance * 0.2);
            
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
              className="absolute cursor-pointer transition-all duration-700 ease-out hover:brightness-125"
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
              onClick={() => {
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
              />
            </div>
          );
        })}
      </div>

       {/* 네비게이션 버튼들 */}
       <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center pointer-events-none z-10 px-8 -translate-y-1/2">
        <button
          onClick={goToPrevious}
          disabled={isAnimating}
          className="pointer-events-auto w-16 h-16 bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-white rounded-full backdrop-blur-md border-2 border-white/20 shadow-lg transition-all duration-300 hover:from-purple-500 hover:to-blue-500 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:scale-90 flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="pointer-events-auto w-16 h-16 bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-white rounded-full backdrop-blur-md border-2 border-white/20 shadow-lg transition-all duration-300 hover:from-purple-500 hover:to-blue-500 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:scale-90 flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* 하단 네비게이션 힌트 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-black/80 to-slate-900/80 rounded-3xl px-6 py-3 backdrop-blur-xl border border-purple-500/30 flex items-center gap-4 shadow-lg">
        <div className="flex gap-1">
          {songs.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 scale-125 shadow-md shadow-purple-500/50'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoverFlow;