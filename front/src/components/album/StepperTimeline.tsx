/**
 * Vertical Timeline Stepper Component
 * 좌측 세로 타임라인 스테퍼
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Music, Image, FileText, Eye, CheckCircle2 } from 'lucide-react';

export type StageId = 'recordings' | 'cover' | 'metadata' | 'preview';

interface StepInfo {
  id: StageId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepperTimelineProps {
  currentStage: StageId;
  onStageChange: (stage: StageId) => void;
  completedStages: StageId[];
  className?: string;
}

const steps: StepInfo[] = [
  {
    id: 'recordings',
    title: '녹음 선택',
    description: '앨범에 포함할 녹음을 선택하세요',
    icon: Music,
  },
  {
    id: 'cover',
    title: '커버/스타일',
    description: '앨범 커버와 스타일을 설정하세요',
    icon: Image,
  },
  {
    id: 'metadata',
    title: '앨범 정보',
    description: '제목, 설명 등을 입력하세요',
    icon: FileText,
  },
  {
    id: 'preview',
    title: '미리보기',
    description: '최종 확인 후 발행하세요',
    icon: Eye,
  },
];

const StepperTimeline: React.FC<StepperTimelineProps> = ({
  currentStage,
  onStageChange,
  completedStages,
  className = '',
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  // 단계 클릭 핸들러
  const handleStepClick = useCallback(
    (stepId: StageId) => {
      onStageChange(stepId);
    },
    [onStageChange]
  );

  // 현재 활성 단계로 스크롤
  useEffect(() => {
    const activeElement = timelineRef.current?.querySelector('[data-active="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentStage]);

  return (
    <div
      ref={timelineRef}
      className={`sticky top-20 h-[calc(100vh-5rem)] overflow-hidden rounded-2xl px-5 py-6 w-full ${className}`}
      role="navigation"
      aria-label="앨범 생성 단계"
      style={{
        background: 'transparent',
        border: 'none'
      }}
    >
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">앨범 만들기</h2>
        <p className="text-sm text-white/60">단계별로 진행해보세요</p>
      </div>

      {/* 타임라인 스텝 */}
      <div className="relative">
        {/* 연결선 */}
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-400/60 to-cyan-300/60" />

        {steps.map((step, index) => {
          const isCompleted = completedStages.includes(step.id);
          const isCurrent = step.id === currentStage;
          const isPast = completedStages.includes(step.id);
          const isFuture = !isPast && !isCurrent;

          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative flex items-start mb-8 last:mb-0 cursor-pointer group transition-all duration-200 overflow-hidden`}
              onClick={() => handleStepClick(step.id)}
              role="button"
              aria-label={`${step.title}: ${step.description}`}
              data-active={isCurrent}
            >
              {/* 아이콘 */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-pink-400 to-cyan-300 border-pink-300 text-white shadow-lg shadow-pink-400/40'
                    : isCurrent
                    ? 'bg-transparent border-pink-300 text-pink-300 ring-2 ring-pink-300/40 shadow-lg shadow-pink-300/30'
                    : 'bg-transparent border-white/50 text-white/60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* 콘텐츠 */}
              <div className="ml-4 flex-1 min-w-0">
                <h3
                  className={`font-semibold transition-colors duration-200 ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-white/80'
                      : 'text-white/50'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm mt-1 transition-colors duration-200 ${
                    isCurrent
                      ? 'text-white/70'
                      : isCompleted
                      ? 'text-white/60'
                      : 'text-white/40'
                  }`}
                >
                  {step.description}
                </p>

                {/* 현재 단계 인디케이터 */}
                {isCurrent && (
                  <div className="mt-2 px-2 py-1 bg-gradient-to-r from-pink-400/30 to-cyan-300/30 border border-pink-300/40 rounded-lg text-xs text-pink-200 font-medium inline-block max-w-full">
                    진행 중
                  </div>
                )}
              </div>

              {/* 호버 효과 */}
              <div
                className={`absolute inset-0 -m-2 rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? 'border-pink-300/40 bg-gradient-to-r from-pink-400/10 to-cyan-300/10'
                    : 'border-transparent group-hover:border-pink-300/20 group-hover:bg-gradient-to-r group-hover:from-pink-400/10 group-hover:to-cyan-300/10'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepperTimeline;