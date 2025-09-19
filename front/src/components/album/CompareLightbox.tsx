/**
 * 커버 비교 라이트박스 모달
 * 선택한 2-4장의 커버를 좌우 비교할 수 있는 모달
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Check } from 'lucide-react';
import { useCoverStore } from '../../stores/coverStore';

interface CompareLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompareLightbox: React.FC<CompareLightboxProps> = ({ isOpen, onClose }) => {
  const {
    compareBin,
    latest,
    history,
    selectedCoverId,
    applyCover,
    toggleFavorite,
    clearCompare,
  } = useCoverStore();

  const [currentIndex, setCurrentIndex] = useState(0);

  // 비교할 커버들 가져오기
  const compareCovers = compareBin
    .map(id => [...latest, ...history].find(cover => cover.id === id))
    .filter(Boolean) as any[];

  // 키보드 이벤트 핸들러
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex(prev => Math.min(compareCovers.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          if (compareCovers[currentIndex]) {
            applyCover(compareCovers[currentIndex].id);
            onClose();
          }
          break;
        case 'f':
        case 'F':
          if (compareCovers[currentIndex]) {
            toggleFavorite(compareCovers[currentIndex].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, compareCovers, onClose, applyCover, toggleFavorite]);

  // 포커스 관리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || compareCovers.length === 0) return null;

  const currentCover = compareCovers[currentIndex];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl h-full max-h-[90vh] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div>
                <h2 className="text-2xl font-bold text-white">커버 비교</h2>
                <p className="text-white/60 text-sm">
                  {currentIndex + 1} / {compareCovers.length} • 키보드 ←/→로 탐색
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* 클리어 버튼 */}
                <button
                  onClick={clearCompare}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  전체 지우기
                </button>

                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="비교 모달 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 flex">
              {/* 좌측 내비게이션 */}
              {compareCovers.length > 1 && currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="w-16 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="이전 커버"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              {/* 커버 이미지 */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="relative max-w-2xl w-full">
                  <motion.img
                    key={currentCover.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    src={currentCover.imageUrl}
                    alt="비교 중인 커버"
                    className="w-full aspect-square object-cover rounded-xl shadow-2xl"
                  />

                  {/* 선택 인디케이터 */}
                  {selectedCoverId === currentCover.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-fuchsia-400 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* 즐겨찾기 인디케이터 */}
                  {currentCover.favorite && (
                    <div className="absolute top-4 left-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white fill-current" />
                    </div>
                  )}
                </div>
              </div>

              {/* 우측 내비게이션 */}
              {compareCovers.length > 1 && currentIndex < compareCovers.length - 1 && (
                <button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="w-16 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="다음 커버"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            {/* 하단 정보 및 액션 */}
            <div className="p-6 border-t border-white/20 space-y-4">
              {/* 커버 정보 */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  생성 시간: {new Date(currentCover.createdAt).toLocaleString('ko-KR')}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                  <span>무드: {currentCover.params.mood}</span>
                  <span>•</span>
                  <span>팔레트: {currentCover.params.palette}</span>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center justify-center gap-4">
                {/* 즐겨찾기 토글 */}
                <motion.button
                  onClick={() => toggleFavorite(currentCover.id)}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2
                    ${currentCover.favorite
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-5 h-5 ${currentCover.favorite ? 'fill-current' : ''}`} />
                  즐겨찾기
                </motion.button>

                {/* 적용하기 */}
                <motion.button
                  onClick={() => {
                    applyCover(currentCover.id);
                    onClose();
                  }}
                  className="px-8 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  이 커버 적용하기
                </motion.button>
              </div>

              {/* 썸네일 탐색 */}
              {compareCovers.length > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  {compareCovers.map((cover, index) => (
                    <button
                      key={cover.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`
                        w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                        ${index === currentIndex
                          ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/30'
                          : 'border-white/30 hover:border-white/50'
                        }
                      `}
                    >
                      <img
                        src={cover.imageUrl}
                        alt={`커버 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 키보드 단축키 안내 */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs text-white/80">
          <div className="space-y-1">
            <div>←/→: 이전/다음</div>
            <div>Enter/Space: 적용</div>
            <div>F: 즐겨찾기</div>
            <div>Esc: 닫기</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default CompareLightbox;