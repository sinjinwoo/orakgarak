/**
 * 앨범 포함 곡 요약 컴포넌트
 * 곡별 vibe pill과 무드 추천 기능
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Clock } from 'lucide-react';
import { useCoverStore } from '../../stores/coverStore';
import type { Track, Mood } from '../../types/cover';

interface TracksSummaryProps {
  tracks: Track[];
  className?: string;
}

const TracksSummary: React.FC<TracksSummaryProps> = ({ tracks, className = '' }) => {
  const { suggestFromTrackMood } = useCoverStore();

  // 무드별 스타일 정의
  const moodStyles: Record<Mood, { bg: string; text: string; label: string }> = {
    retro: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: '레트로' },
    emotional: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '감성' },
    pastel: { bg: 'bg-pink-300/20', text: 'text-pink-300', label: '파스텔' },
    neon: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', label: '네온' },
    dark: { bg: 'bg-gray-700/40', text: 'text-gray-300', label: '다크' },
  };

  // 트랙에서 무드 추출 (더미 로직 - 실제로는 곡 분석 결과 사용)
  const getTrackVibe = (track: Track): Mood => {
    if (track.vibe) return track.vibe;

    // 곡 제목 기반 간단한 무드 추측
    const title = track.title.toLowerCase();
    if (title.includes('사랑') || title.includes('편지')) return 'emotional';
    if (title.includes('spring') || title.includes('좋아')) return 'pastel';
    if (title.includes('밤') || title.includes('어둠')) return 'dark';
    return 'neon'; // 기본값
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className={`p-6 bg-white/5 rounded-xl border border-white/10 ${className}`}>
        <div className="text-center space-y-3">
          <Music className="w-12 h-12 text-white/30 mx-auto" />
          <p className="text-white/60">아직 선택된 곡이 없습니다</p>
          <p className="text-white/40 text-sm">
            녹음 단계에서 곡을 선택하면 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white/5 rounded-xl border border-white/10 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Music className="w-6 h-6 text-fuchsia-400" />
        <h3 className="text-xl font-bold text-white">앨범 포함 곡</h3>
        <div className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 text-sm rounded-full">
          {tracks.length}곡
        </div>
      </div>

      {/* 곡 목록 */}
      <div className="space-y-3">
        {tracks.map((track, index) => {
          const vibe = getTrackVibe(track);
          const vibeStyle = moodStyles[vibe];

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => suggestFromTrackMood(track.id)}
            >
              {/* 트랙 번호 */}
              <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-sm font-bold text-fuchsia-300">
                {index + 1}
              </div>

              {/* 곡 정보 */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">
                  {track.title}
                </h4>
                {track.artist && (
                  <p className="text-sm text-white/60 truncate">
                    {track.artist}
                  </p>
                )}
              </div>

              {/* 재생 시간 */}
              {track.duration && (
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Clock className="w-3 h-3" />
                  {formatDuration(track.duration)}
                </div>
              )}

              {/* Vibe 태그 */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  suggestFromTrackMood(track.id);
                }}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${vibeStyle.bg} ${vibeStyle.text} hover:scale-105
                  group-hover:ring-2 group-hover:ring-fuchsia-400/30
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={`${vibeStyle.label} 무드로 커버 스타일 추천`}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {vibeStyle.label}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* 하단 안내 */}
      <div className="mt-6 p-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-fuchsia-200">
              곡 분위기 기반 추천
            </p>
            <p className="text-xs text-fuchsia-300/80 leading-relaxed">
              각 곡의 분위기 태그를 클릭하면 해당 무드에 맞는 커버 스타일을 컨트롤 패널에 자동으로 설정합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-white">
            {tracks.length}
          </div>
          <div className="text-xs text-white/60">총 곡 수</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-white">
            {formatDuration(tracks.reduce((total, track) => total + (track.duration || 0), 0))}
          </div>
          <div className="text-xs text-white/60">총 재생 시간</div>
        </div>
      </div>
    </div>
  );
};

export default TracksSummary;