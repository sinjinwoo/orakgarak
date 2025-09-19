/**
 * 좌측 컨트롤 패널 컴포넌트
 * 무드, 팔레트, 슬라이더, 프롬프트, 생성 버튼을 포함
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useCoverStore } from '../../stores/coverStore';
import MoodSelector from './MoodSelector';
import PaletteSelector from './PaletteSelector';
import ParameterSliders from './ParameterSliders';

interface ControlsPanelProps {
  className?: string;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ className = '' }) => {
  const {
    params,
    generating,
    setParams,
    generate,
  } = useCoverStore();

  const [hasChanges, setHasChanges] = useState(false);

  const handleParameterChange = (key: string, value: any) => {
    setParams({ [key]: value });
    setHasChanges(true);
  };

  const handleGenerate = async () => {
    try {
      await generate(3);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to generate covers:', error);
    }
  };

  return (
    <div className={`
      sticky top-20 h-[calc(100vh-5rem)] overflow-auto
      rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
      p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
      ${className}
    `}>
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">커버 생성</h2>
        <p className="text-white/60 text-sm">
          원하는 스타일로 커버를 만들어보세요
        </p>
      </div>

      {/* 무드 선택 */}
      <MoodSelector
        selectedMood={params.mood}
        onMoodChange={(mood) => handleParameterChange('mood', mood)}
      />

      {/* 팔레트 선택 */}
      <PaletteSelector
        selectedPalette={params.palette}
        onPaletteChange={(palette) => handleParameterChange('palette', palette)}
      />

      {/* 파라미터 슬라이더 */}
      <ParameterSliders
        brightness={params.brightness}
        saturation={params.saturation}
        grain={params.grain}
        onParameterChange={handleParameterChange}
      />

      {/* 프롬프트 입력 */}
      <div className="space-y-3">
        <label className="text-lg font-semibold text-white">
          스타일 프롬프트 (선택사항)
        </label>
        <textarea
          value={params.prompt || ''}
          onChange={(e) => handleParameterChange('prompt', e.target.value)}
          placeholder="예: 미니멀한 일러스트, 빈티지 포스터 스타일..."
          className="w-full h-24 px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 resize-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 outline-none transition-all"
          maxLength={200}
        />
        <div className="text-xs text-white/50 text-right">
          {(params.prompt || '').length}/200
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="space-y-4">
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-amber-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            변경 사항이 있습니다
          </motion.div>
        )}

        <motion.button
          onClick={handleGenerate}
          disabled={generating}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
            flex items-center justify-center gap-3
            ${generating
              ? 'bg-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 hover:scale-105 active:scale-95'
            }
          `}
          whileHover={!generating ? { scale: 1.02 } : {}}
          whileTap={!generating ? { scale: 0.98 } : {}}
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'AI 커버 생성 중...' : 'AI 커버 생성하기'}
        </motion.button>

        <p className="text-xs text-white/60 text-center leading-relaxed">
          AI가 설정된 파라미터를 바탕으로 3개의 커버 이미지를 생성합니다.
          생성에는 약 1-2분이 소요됩니다.
        </p>
      </div>
    </div>
  );
};

export default ControlsPanel;