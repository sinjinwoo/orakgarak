/**
 * Mini Preview Card Component - 실시간 커버 미리보기
 * 우측 상단에 위치하며 파라미터 변경 시 즉시 반영
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useCoverStore } from '../../stores/coverStore';

interface MiniPreviewTrack {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  order: number;
}

interface MiniPreviewCardProps {
  tracks: MiniPreviewTrack[];
  coverImageUrl?: string;
  albumTitle?: string;
  isPublic?: boolean;
  className?: string;
}

const MiniPreviewCard: React.FC<MiniPreviewCardProps> = ({
  tracks,
  coverImageUrl,
  albumTitle = '새 앨범',
  className = '',
}) => {
  const { params, selectedCoverId, history, latest } = useCoverStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // 총 재생 시간 계산
  const totalDurationSec = tracks.reduce((total, track) => total + track.durationSec, 0);
  const totalMinutes = Math.floor(totalDurationSec / 60);
  const totalSeconds = totalDurationSec % 60;
  const formattedDuration = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;

  const defaultCover = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';

  // 커버 이미지 실시간 업데이트
  useEffect(() => {
    // 앨범 스토어의 coverImage가 우선순위가 높음 (직접 업로드된 이미지 포함)
    if (coverImageUrl) {
      setPreviewImage(coverImageUrl);
      return;
    }

    // 선택된 AI 생성 커버가 있다면 사용
    if (selectedCoverId) {
      const selectedCover = [...latest, ...history].find(c => c.id === selectedCoverId);
      if (selectedCover) {
        setPreviewImage(selectedCover.imageUrl);
        return;
      }
    }

    // 기본 커버 이미지 사용
    setPreviewImage(null);
  }, [coverImageUrl, selectedCoverId, latest, history]);

  // CSS 필터를 이용한 실시간 미리보기 스타일
  const getPreviewStyle = () => {
    const { brightness, saturation } = params;

    const filters = [];

    if (brightness !== 0) {
      filters.push(`brightness(${1 + brightness})`);
    }

    if (saturation !== 0) {
      filters.push(`saturate(${1 + saturation})`);
    }

    return {
      filter: filters.join(' '),
      transition: 'filter 0.3s ease',
    };
  };

  // 무드별 배경 그라디언트
  const getMoodGradient = () => {
    const moodGradients = {
      retro: 'from-orange-500/20 to-yellow-600/20',
      emotional: 'from-blue-500/20 to-indigo-600/20',
      pastel: 'from-pink-300/20 to-purple-300/20',
      neon: 'from-fuchsia-500/20 to-cyan-500/20',
      dark: 'from-gray-800/20 to-black/20',
    };
    return moodGradients[params.mood] || moodGradients.neon;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`
        w-56 bg-white/15 backdrop-blur-xl rounded-2xl border-2 border-cyan-300/80
        ${isExpanded ? 'p-4' : 'p-3'} shadow-2xl shadow-cyan-300/60
        ${className}
      `}
      role="region"
      aria-label="실시간 커버 미리보기"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-300" />
          실시간 미리보기
        </h3>
        <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded-md hover:bg-pink-300/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isExpanded ? "미리보기 접기" : "미리보기 펼치기"}
                  >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-cyan-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyan-300" />
            )}
          </motion.button>
        </div>
      </div>

      {/* 커버 이미지 - 실시간 미리보기 적용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="relative mb-4">
              <div className={`aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${getMoodGradient()}`}>
                <div className="relative w-full h-full">
                  <img
                    src={previewImage || coverImageUrl || defaultCover}
                    alt={albumTitle}
                    className="w-full h-full object-cover"
                    style={getPreviewStyle()}
                    onError={(e) => {
                      e.currentTarget.src = defaultCover;
                    }}
                  />

                  {/* 팔레트 색상 오버레이 */}
                  <div
                    className="absolute inset-0 mix-blend-color opacity-30"
                    style={{ backgroundColor: params.palette }}
                  />

                  {/* 그레인 효과 */}
                  {params.grain > 0 && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,${params.grain}) 1px, transparent 1px)`,
                        backgroundSize: '4px 4px',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 앨범 정보 */}
            <div className="space-y-2 mb-4">
              <h4 className="font-bold text-white text-base leading-tight line-clamp-2">
                {albumTitle}
              </h4>

              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{tracks.length}곡</span>
                <span>{totalDurationSec > 0 ? formattedDuration : '0:00'}</span>
              </div>
            </div>

            {/* 트랙 목록 (최대 3개) */}
            {tracks.length > 0 && (
              <div className="mb-4 space-y-1">
                {tracks.slice(0, 3).map((track) => (
                  <div key={track.id} className="flex items-center text-xs text-white/70">
                    <span className="w-4 text-right mr-2">{track.order}.</span>
                    <span className="flex-1 truncate">{track.title}</span>
                  </div>
                ))}
                {tracks.length > 3 && (
                  <div className="text-xs text-white/50 text-center pt-1">
                    외 {tracks.length - 3}곡
                  </div>
                )}
              </div>
            )}

            {/* Progress indicator */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: tracks.length > 0 ? '75%' : '50%' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                  />
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {tracks.length > 0 ? '75%' : '50%'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 접었을 때 간단한 정보 표시 */}
              {!isExpanded && (
                <div className="flex items-center justify-between text-xs text-cyan-200/90">
                  <span>{tracks.length}곡</span>
                  <span>{totalDurationSec > 0 ? formattedDuration : '0:00'}</span>
                </div>
              )}
    </motion.div>
  );
};

export default MiniPreviewCard;