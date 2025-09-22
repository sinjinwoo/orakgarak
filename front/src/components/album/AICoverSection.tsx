/**
 * AI 커버 생성 섹션 컴포넌트
 * 스타일 프리셋, 레퍼런스 보드, 파라미터 조정이 가능한 AI 커버 생성
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Check, Eye, EyeOff
} from 'lucide-react';
import { useAlbumMetaStore } from '../../stores/albumMetaStore';
import { generateCovers } from '../../services/api/cover';

interface AICoverSectionProps {
  selectedRecordings: string[];
  className?: string;
}


const AICoverSection: React.FC<AICoverSectionProps> = ({
  selectedRecordings,
  className = '',
}) => {
  const {
    cover,
    addCoverVariant,
    selectCoverVariant,
    comparisonMode,
    setComparisonMode,
    setCoverUpload,
  } = useAlbumMetaStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || selectedRecordings.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      // selectedRecordings는 string[] 형태이므로 number[]로 변환
      const uploadIds = selectedRecordings.map(id => parseInt(id, 10));

      const generatedCover = await generateCovers(uploadIds);

      // 생성된 커버를 스토어에 추가
      addCoverVariant({
        id: generatedCover.id,
        imageUrl: generatedCover.imageUrl,
        seed: Math.floor(Math.random() * 1000000),
      });

      // uploadId 정보도 저장하고 즉시 선택
      if (generatedCover.uploadId) {
        setCoverUpload(generatedCover.imageUrl, generatedCover.uploadId);
        selectCoverVariant(generatedCover.id); // 생성된 커버를 자동으로 선택
      }
    } catch (err) {
      console.error('AI 커버 생성 실패:', err);
      setError('AI 커버 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedRecordings, addCoverVariant]);


  return (
    <div className={`space-y-6 ${className}`}>



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
                  onClick={() => {
                    selectCoverVariant(variant.id);
                    // 선택된 커버 정보를 명시적으로 저장
                    setCoverUpload(variant.imageUrl);
                  }}
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
            선택한 녹음을 바탕으로 AI가 앨범 커버를 생성해드려요
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