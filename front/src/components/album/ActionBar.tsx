/**
 * Action Bar Component
 * 하단 고정 액션 바 - 이전/임시저장/다음 버튼
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

export type StageId = 'recordings' | 'cover' | 'metadata' | 'preview';

interface ActionBarProps {
  currentStage: StageId;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isSaving?: boolean;
  className?: string;
}

const stageLabels: Record<StageId, { prev?: string; next: string }> = {
  recordings: { next: '커버 선택' },
  cover: { prev: '녹음 선택', next: '앨범 정보' },
  metadata: { prev: '커버 선택', next: '미리보기' },
  preview: { prev: '앨범 정보', next: '발행하기' },
};

const ActionBar: React.FC<ActionBarProps> = ({
  currentStage,
  onPrev,
  onNext,
  onSaveDraft,
  canGoNext,
  canGoPrev,
  isSaving = false,
  className = '',
}) => {
  const labels = stageLabels[currentStage];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/10 p-4 z-50 ${className}`}
      role="navigation"
      aria-label="앨범 생성 액션"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 이전 버튼 */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            canGoPrev
              ? 'text-white hover:bg-white/10 border border-white/20 hover:border-white/30'
              : 'text-white/40 cursor-not-allowed border border-white/10'
          }`}
          aria-label={labels.prev ? `이전 단계: ${labels.prev}` : '이전'}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">
            {labels.prev || '이전'}
          </span>
        </button>

        {/* 중앙 임시저장 버튼 */}
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="임시저장"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? '저장 중...' : '임시저장'}
          </span>
        </button>

        {/* 다음 버튼 */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            canGoNext
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 text-white shadow-lg shadow-fuchsia-500/25'
              : 'bg-gray-700 text-white/40 cursor-not-allowed'
          }`}
          aria-label={`다음 단계: ${labels.next}`}
        >
          <span className="hidden sm:inline">{labels.next}</span>
          <span className="sm:hidden">다음</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="max-w-7xl mx-auto mt-3">
        <div className="w-full bg-white/10 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${
                currentStage === 'recordings'
                  ? 25
                  : currentStage === 'cover'
                  ? 50
                  : currentStage === 'metadata'
                  ? 75
                  : 100
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ActionBar;