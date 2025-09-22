/**
 * AI 커버 생성 섹션 컴포넌트
 * 스타일 프리셋, 레퍼런스 보드, 파라미터 조정이 가능한 AI 커버 생성
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Heart, Check, Palette, Settings,
  Plus, X, Upload, RotateCcw, Eye, EyeOff
} from 'lucide-react';
import { useAlbumMetaStore } from '../../stores/albumMetaStore';
import { generateCovers } from '../../api/cover';

interface AICoverSectionProps {
  selectedRecordings: string[];
  className?: string;
}

interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  style: 'poster' | 'filmgrain' | 'lineart' | 'collage';
}

const stylePresets: StylePreset[] = [
  {
    id: 'poster',
    name: '포스터',
    description: '강렬하고 모던한 포스터 스타일',
    thumbnail: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=100&h=100&fit=crop',
    style: 'poster',
  },
  {
    id: 'filmgrain',
    name: '필름그레인',
    description: '빈티지하고 따뜻한 필름 질감',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop',
    style: 'filmgrain',
  },
  {
    id: 'lineart',
    name: '라인아트',
    description: '깔끔하고 미니멀한 선화 스타일',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    style: 'lineart',
  },
  {
    id: 'collage',
    name: '콜라주',
    description: '창의적이고 다양한 요소의 조합',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100&h=100&fit=crop',
    style: 'collage',
  },
];

const AICoverSection: React.FC<AICoverSectionProps> = ({
  selectedRecordings,
  className = '',
}) => {
  const {
    cover,
    updateCoverParams,
    addCoverVariant,
    selectCoverVariant,
    addToReferenceBoard,
    removeFromReferenceBoard,
    comparisonMode,
    setComparisonMode,
    generatePrompt,
  } = useAlbumMetaStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [referenceInput, setReferenceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStyleSelect = useCallback((style: StylePreset['style']) => {
    updateCoverParams({ style });
  }, [updateCoverParams]);

  const handleParamChange = useCallback((param: string, value: number | string) => {
    updateCoverParams({ [param]: value });
  }, [updateCoverParams]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || selectedRecordings.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = generatePrompt();
      const coverParams = {
        style: cover.params.style,
        emphasizeColor: cover.params.emphasizeColor,
        noise: cover.params.noise,
        texture: cover.params.texture,
        focusSubject: cover.params.focusSubject,
        marginRatio: cover.params.marginRatio,
        typoRatio: cover.params.typoRatio,
        prompt: prompt.text,
      };

      const generatedCovers = await generateCovers(coverParams, selectedRecordings, 4);

      // 생성된 커버들을 스토어에 추가
      generatedCovers.forEach(cover => {
        addCoverVariant({
          id: cover.id,
          imageUrl: cover.imageUrl,
          seed: Math.floor(Math.random() * 1000000),
        });
      });
    } catch (err) {
      console.error('AI 커버 생성 실패:', err);
      setError('AI 커버 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedRecordings, cover.params, generatePrompt, addCoverVariant]);

  const handleAddReference = useCallback((url: string) => {
    if (!url.trim()) return;

    addToReferenceBoard({
      id: `ref_${Date.now()}`,
      url: url.trim(),
      type: 'url',
      palette: [], // 실제로는 이미지에서 색상을 추출해야 함
    });
    setReferenceInput('');
  }, [addToReferenceBoard]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 스타일 프리셋 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">스타일 선택</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stylePresets.map((preset) => {
            const isSelected = cover.params.style === preset.style;

            return (
              <motion.button
                key={preset.id}
                onClick={() => handleStyleSelect(preset.style)}
                className={`
                  relative p-3 rounded-xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-square mb-2 rounded-lg overflow-hidden">
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium text-white">{preset.name}</div>
                <div className="text-xs text-white/60 mt-1">{preset.description}</div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-purple-500 rounded-full p-1"
                  >
                    <Check size={12} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 고급 설정 */}
      <div>
        <motion.button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          whileHover={{ x: 5 }}
        >
          <Settings size={16} />
          <span className="text-sm font-medium">고급 설정</span>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={16} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              {/* 파라미터 슬라이더들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">강조 색상</label>
                  <input
                    type="color"
                    value={cover.params.emphasizeColor}
                    onChange={(e) => handleParamChange('emphasizeColor', e.target.value)}
                    className="w-full h-10 rounded-lg bg-transparent border border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    노이즈: {Math.round(cover.params.noise * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={cover.params.noise}
                    onChange={(e) => handleParamChange('noise', parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    텍스처: {Math.round(cover.params.texture * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={cover.params.texture}
                    onChange={(e) => handleParamChange('texture', parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    여백 비율: {Math.round(cover.params.marginRatio * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.05}
                    value={cover.params.marginRatio}
                    onChange={(e) => handleParamChange('marginRatio', parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* 포커스 주제 */}
              <div>
                <label className="block text-white/70 text-sm mb-2">포커스 주제</label>
                <input
                  type="text"
                  value={cover.params.focusSubject}
                  onChange={(e) => handleParamChange('focusSubject', e.target.value)}
                  placeholder="예: 기타, 마이크, 도시, 자연..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 레퍼런스 보드 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">레퍼런스 보드</h4>
          <span className="text-xs text-white/60">{cover.referenceBoard.length}/8</span>
        </div>

        {/* 레퍼런스 추가 */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            placeholder="이미지 URL 또는 검색어 입력"
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            onKeyPress={(e) => e.key === 'Enter' && handleAddReference(referenceInput)}
          />
          <motion.button
            onClick={() => handleAddReference(referenceInput)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
          </motion.button>
        </div>

        {/* 레퍼런스 이미지들 */}
        {cover.referenceBoard.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {cover.referenceBoard.map((ref) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group aspect-square bg-white/5 rounded-lg overflow-hidden"
              >
                <img
                  src={ref.url}
                  alt="레퍼런스"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromReferenceBoard(ref.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 생성 버튼 */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || selectedRecordings.length === 0}
          className={`
            flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
            ${isGenerating
              ? 'bg-purple-500/20 text-purple-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25'
            }
          `}
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {isGenerating ? 'AI 생성 중...' : 'AI 커버 생성'}
        </motion.button>

        <motion.button
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`
            px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2
            ${comparisonMode
              ? 'bg-blue-500/20 text-blue-300 border-2 border-blue-400/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20 border-2 border-transparent'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {comparisonMode ? <Eye size={16} /> : <EyeOff size={16} />}
          비교
        </motion.button>
      </div>

      {/* 생성된 커버 갤러리 */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500" />
              </div>
              <p className="text-white/80 font-medium">AI가 커버를 생성하고 있습니다...</p>
              <p className="text-white/50 text-sm">트랙 분위기와 설정을 분석해 최적의 커버를 만들어드려요</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 생성된 커버들 */}
      {!isGenerating && cover.variants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-white">생성된 커버</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cover.variants.map((variant, index) => {
              const isSelected = cover.variantId === variant.id;

              return (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative group cursor-pointer rounded-xl overflow-hidden
                    ${isSelected
                      ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/25'
                      : 'hover:scale-105'
                    }
                  `}
                  onClick={() => selectCoverVariant(variant.id)}
                  whileHover={{ scale: isSelected ? 1.02 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
                    <img
                      src={variant.imageUrl}
                      alt={`AI 생성 커버 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 선택된 커버 표시 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 bg-purple-500 rounded-full p-1.5"
                    >
                      <Check size={14} className="text-white" />
                    </motion.div>
                  )}

                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-sm font-medium">
                      {isSelected ? '선택됨' : '클릭하여 선택'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 오류 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 빈 상태 */}
      {!isGenerating && cover.variants.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles size={48} className="mx-auto mb-4 text-white/40" />
          <h4 className="text-lg font-semibold text-white mb-2">AI 커버 생성</h4>
          <p className="text-white/60 text-sm mb-6">
            스타일을 선택하고 생성 버튼을 눌러 AI 커버를 만들어보세요
          </p>
          {selectedRecordings.length === 0 && (
            <p className="text-amber-400 text-sm">
              먼저 트랙을 선택해주세요
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AICoverSection;