/**
 * 커버 선택 탭 컴포넌트
 * AI 생성과 직접 업로드 간 전환을 위한 탭 인터페이스
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Upload } from 'lucide-react';

export type CoverSelectionMode = 'ai' | 'upload';

interface CoverSelectionTabProps {
  mode: CoverSelectionMode;
  onModeChange: (mode: CoverSelectionMode) => void;
  className?: string;
}

const CoverSelectionTab: React.FC<CoverSelectionTabProps> = ({
  mode,
  onModeChange,
  className = '',
}) => {
  const tabs = [
    {
      id: 'ai' as const,
      label: 'AI 생성',
      icon: Sparkles,
      description: '자동으로 멋진 커버 생성',
    },
    {
      id: 'upload' as const,
      label: '직접 업로드',
      icon: Upload,
      description: '원하는 이미지 업로드',
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* 탭 컨테이너 */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-1">
        <div className="grid grid-cols-2 gap-1 relative">
          {/* 슬라이딩 배경 */}
          <motion.div
            className="absolute inset-y-1 bg-gradient-to-r from-cyan-300/30 to-pink-300/30 backdrop-blur-sm rounded-lg"
            layoutId="tab-background"
            animate={{
              x: mode === 'ai' ? 0 : '100%',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{
              width: 'calc(50% - 2px)',
            }}
          />

          {tabs.map((tab) => {
            const isActive = mode === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onModeChange(tab.id)}
                className={`
                  relative z-10 px-6 py-4 rounded-lg text-left transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-transparent
                  ${isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isActive}
                aria-label={`${tab.label} 모드로 전환`}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    className={`
                      p-2 rounded-lg transition-colors duration-200
                      ${isActive
                        ? 'bg-white/10 text-white'
                        : 'bg-white/5 text-white/60'
                      }
                    `}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={16} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className={`
                      font-semibold transition-colors duration-200
                      ${isActive ? 'text-white' : 'text-white/70'}
                    `}>
                      {tab.label}
                    </div>
                    <div className={`
                      text-xs transition-colors duration-200 mt-1
                      ${isActive ? 'text-white/70' : 'text-white/50'}
                    `}>
                      {tab.description}
                    </div>
                  </div>
                </div>

                {/* 활성 상태 표시기 */}
                {isActive && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 설명 텍스트 */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center"
      >
        <p className="text-white/60 text-sm">
          {mode === 'ai'
            ? 'AI가 트랙의 분위기를 분석해 최적의 앨범 커버를 생성합니다'
            : '직접 업로드한 이미지를 편집하여 앨범 커버로 사용할 수 있습니다'
          }
        </p>
      </motion.div>
    </div>
  );
};

export default CoverSelectionTab;