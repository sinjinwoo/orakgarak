/**
 * 커버 갤러리 컴포넌트
 * 최신 생성 결과 큰 카드와 히스토리 스크롤 섹션
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Check, Plus, Sparkles, Clock } from 'lucide-react';
import { useCoverStore } from '../../stores/coverStore';
import type { GeneratedCover } from '../../types/cover';

interface CoverGalleryProps {
  className?: string;
}

const CoverGallery: React.FC<CoverGalleryProps> = ({ className = '' }) => {
  const {
    latest,
    history,
    selectedCoverId,
    compareBin,
    applyCover,
    toggleFavorite,
    addToCompare,
    removeFromCompare,
  } = useCoverStore();

  const handleToggleCompare = (coverId: string) => {
    if (compareBin.includes(coverId)) {
      removeFromCompare(coverId);
    } else {
      addToCompare(coverId);
    }
  };

  const CoverCard: React.FC<{
    cover: GeneratedCover;
    size: 'large' | 'small';
    onApply?: () => void;
    onToggleFavorite?: () => void;
    onToggleCompare?: () => void;
    onPreview?: () => void;
  }> = ({
    cover,
    size,
    onApply,
    onToggleFavorite,
    onToggleCompare,
    onPreview,
  }) => {
    const isSelected = selectedCoverId === cover.id;
    const isInCompare = compareBin.includes(cover.id);
    const cardSize = size === 'large' ? 'aspect-square' : 'aspect-[4/3]';

    return (
      <motion.div
        layout
        className={`
          group relative ${cardSize} rounded-xl overflow-hidden cursor-pointer
          border-2 transition-all duration-200
          ${isSelected
            ? 'border-fuchsia-400 ring-4 ring-fuchsia-400/30'
            : 'border-white/20 hover:border-white/40'
          }
        `}
        whileHover={{ scale: size === 'large' ? 1.02 : 1.05 }}
        role="button"
        tabIndex={0}
        aria-label={`커버 이미지 - ${new Date(cover.createdAt).toLocaleString()}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onPreview) onPreview();
          if (e.key === 'a' || e.key === 'A') onApply?.();
          if (e.key === 'f' || e.key === 'F') onToggleFavorite?.();
          if (e.key === 'c' || e.key === 'C') onToggleCompare?.();
        }}
      >
        {/* 메인 이미지 */}
        <img
          src={cover.imageUrl}
          alt="생성된 커버"
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* 선택 인디케이터 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-6 h-6 bg-fuchsia-400 rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* 즐겨찾기 인디케이터 */}
        {cover.favorite && (
          <div className="absolute top-3 left-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
        )}

        {/* 비교 선택 인디케이터 */}
        {isInCompare && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-blue-500 rounded-full text-xs text-white font-medium">
            비교 {compareBin.indexOf(cover.id) + 1}
          </div>
        )}

        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between">
              {/* 생성 시간 */}
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Clock className="w-3 h-3" />
                {new Date(cover.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2">
                {/* 즐겨찾기 */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.();
                  }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-colors
                    ${cover.favorite
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-red-500'
                    }
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="즐겨찾기 토글"
                >
                  <Heart className={`w-4 h-4 ${cover.favorite ? 'fill-current' : ''}`} />
                </motion.button>

                {/* 비교 담기 */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare?.();
                  }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-colors
                    ${isInCompare
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white hover:bg-blue-500'
                    }
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="비교 담기"
                  disabled={!isInCompare && compareBin.length >= 4}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>

                {/* 확대 */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.();
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="확대 보기"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* 적용 버튼 */}
            {size === 'large' && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.();
                }}
                className="w-full mt-3 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                이 커버 적용하기
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* 최신 생성 섹션 */}
      {latest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-2xl font-bold text-white">최신 생성</h2>
            <div className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 text-sm rounded-full">
              {latest.length}개
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((cover) => (
              <CoverCard
                key={cover.id}
                cover={cover}
                size="large"
                onApply={() => applyCover(cover.id)}
                onToggleFavorite={() => toggleFavorite(cover.id)}
                onToggleCompare={() => handleToggleCompare(cover.id)}
                onPreview={() => {
                  // TODO: 라이트박스 모달 열기
                  console.log('Preview cover:', cover.id);
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 히스토리 섹션 */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-white/60" />
            <h2 className="text-xl font-semibold text-white">히스토리</h2>
            <div className="px-3 py-1 bg-white/10 text-white/60 text-sm rounded-full">
              {history.length}개
            </div>
          </div>

          {/* 가로 스크롤 */}
          <div
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            role="region"
            aria-label="커버 히스토리"
          >
            {history.map((cover) => (
              <div key={cover.id} className="flex-shrink-0 w-48">
                <CoverCard
                  cover={cover}
                  size="small"
                  onApply={() => applyCover(cover.id)}
                  onToggleFavorite={() => toggleFavorite(cover.id)}
                  onToggleCompare={() => handleToggleCompare(cover.id)}
                  onPreview={() => {
                    // TODO: 라이트박스 모달 열기
                    console.log('Preview cover:', cover.id);
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 빈 상태 */}
      {latest.length === 0 && history.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <Sparkles className="w-16 h-16 text-white/30 mx-auto" />
          <h3 className="text-xl font-semibold text-white/60">아직 생성된 커버가 없습니다</h3>
          <p className="text-white/40">
            좌측 컨트롤을 이용해서 첫 번째 커버를 생성해보세요!
          </p>
        </motion.div>
      )}

      {/* 비교 중인 항목 표시 */}
      {compareBin.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
        >
          비교 중: {compareBin.length}/4
        </motion.div>
      )}

      {/* 라이브 리전 - 스크린 리더용 */}
      <div className="sr-only" aria-live="polite" role="status">
        {latest.length > 0 && `${latest.length}개의 새로운 커버가 생성되었습니다.`}
      </div>
    </div>
  );
};

export default CoverGallery;