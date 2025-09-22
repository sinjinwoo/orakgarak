/**
 * 무드 선택 컴포넌트
 * 시각적 썸네일과 색상 칩이 포함된 무드 카드들을 제공
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Mood, MoodConfig } from '../../types/cover';

interface MoodSelectorProps {
  selectedMood: Mood;
  onMoodChange: (mood: Mood) => void;
  className?: string;
}

const moodConfigs: MoodConfig[] = [
  {
    mood: 'retro',
    label: '레트로',
    description: '빈티지하고 따뜻한 느낌',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop',
    colors: ['#FF8C42', '#FF6B35', '#F7931E'],
    defaultPalette: '#FF8C42',
  },
  {
    mood: 'emotional',
    label: '감성',
    description: '차분하고 감정적인 분위기',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop',
    colors: ['#6B73FF', '#5A6ACF', '#4D5DB5'],
    defaultPalette: '#6B73FF',
  },
  {
    mood: 'pastel',
    label: '파스텔',
    description: '부드럽고 포근한 색감',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f198198718?w=80&h=80&fit=crop',
    colors: ['#FFB3D1', '#C8A9F7', '#A8E6CF'],
    defaultPalette: '#FFB3D1',
  },
  {
    mood: 'neon',
    label: '네온',
    description: '밝고 활기찬 에너지',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=80&h=80&fit=crop',
    colors: ['#A55CFF', '#FF1B6B', '#45CAFF'],
    defaultPalette: '#A55CFF',
  },
  {
    mood: 'dark',
    label: '다크',
    description: '신비롭고 세련된 분위기',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop',
    colors: ['#2D1B69', '#141216', '#1A1A2E'],
    defaultPalette: '#2D1B69',
  },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodChange,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">무드 선택</h3>

      <div
        className="grid grid-cols-1 gap-3"
        role="radiogroup"
        aria-label="앨범 커버 무드 선택"
      >
        {moodConfigs.map((config) => (
          <motion.button
            key={config.mood}
            role="radio"
            aria-checked={selectedMood === config.mood}
            aria-label={`${config.label} - ${config.description}`}
            className={`
              w-full p-3 rounded-xl border-2 transition-all duration-200
              flex items-center gap-3 text-left
              ${selectedMood === config.mood
                ? 'border-fuchsia-400 ring-4 ring-fuchsia-400/30 bg-white/10'
                : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
              }
            `}
            onClick={() => onMoodChange(config.mood)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 썸네일 이미지 */}
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={config.thumbnailUrl}
                alt={config.label}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 텍스트 정보 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white mb-1">
                {config.label}
              </div>
              <div className="text-sm text-white/60 leading-tight">
                {config.description}
              </div>
            </div>

            {/* 색상 칩들 */}
            <div className="flex gap-1 flex-shrink-0">
              {config.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* 선택 인디케이터 */}
            {selectedMood === config.mood && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-fuchsia-400 flex items-center justify-center flex-shrink-0"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;