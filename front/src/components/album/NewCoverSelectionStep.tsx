/**
 * 새로운 커버 선택 단계 컴포넌트
 * 무드 기반 2분할 레이아웃으로 리팩토링된 버전
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCoverStore } from '../../stores/coverStore';
import ControlsPanel from './ControlsPanel';
import CoverGallery from './CoverGallery';
import CompareLightbox from './CompareLightbox';
import TracksSummary from './TracksSummary';
import type { Track } from '../../types/cover';

interface NewCoverSelectionStepProps {
  selectedRecordings: string[];
  className?: string;
}

// 더미 녹음 데이터를 Track 타입으로 변환
const mockTracks: Track[] = [
  {
    id: '1',
    title: '좋아',
    artist: '윤종신',
    vibe: 'emotional',
    duration: 225,
  },
  {
    id: '2',
    title: '사랑은 은하수 다방에서',
    artist: '10cm',
    vibe: 'pastel',
    duration: 252,
  },
  {
    id: '3',
    title: '밤편지',
    artist: '아이유',
    vibe: 'emotional',
    duration: 203,
  },
  {
    id: '4',
    title: 'Spring Day',
    artist: 'BTS',
    vibe: 'pastel',
    duration: 246,
  },
  {
    id: '5',
    title: '너를 만나',
    artist: '폴킴',
    vibe: 'emotional',
    duration: 238,
  },
];

const NewCoverSelectionStep: React.FC<NewCoverSelectionStepProps> = ({
  selectedRecordings,
  className = '',
}) => {
  const { loadFromStorage } = useCoverStore();
  const [showCompareLightbox, setShowCompareLightbox] = useState(false);

  // 선택된 녹음들에 해당하는 트랙 필터링
  const selectedTracks = mockTracks.filter(track =>
    selectedRecordings.includes(track.id)
  );

  // 컴포넌트 마운트 시 저장된 데이터 불러오기
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 키보드 단축키 - 비교 모달 열기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        setShowCompareLightbox(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`min-h-screen ${className}`}>
      {/* 메인 2분할 레이아웃 */}
      <div className="grid grid-cols-[360px_1fr] gap-6 min-h-[calc(100vh-8rem)]">
        {/* 좌측 컨트롤 패널 */}
        <ControlsPanel />

        {/* 우측 갤러리 및 정보 */}
        <div className="flex flex-col space-y-6 min-w-0">
          {/* 갤러리 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <CoverGallery />
          </motion.div>

          {/* 트랙 요약 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TracksSummary tracks={selectedTracks} />
          </motion.div>
        </div>
      </div>

      {/* 비교 라이트박스 */}
      <CompareLightbox
        isOpen={showCompareLightbox}
        onClose={() => setShowCompareLightbox(false)}
      />

      {/* 키보드 단축키 안내 (개발 중에만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-white/80 space-y-1">
          <div className="font-semibold mb-2">키보드 단축키:</div>
          <div>Ctrl+C: 비교 모달 열기</div>
          <div>Tab: 컨트롤 탐색</div>
          <div>Enter/Space: 선택</div>
        </div>
      )}
    </div>
  );
};

export default NewCoverSelectionStep;