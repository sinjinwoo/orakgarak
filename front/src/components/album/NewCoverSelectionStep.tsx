/**
 * 새로운 커버 선택 단계 컴포넌트
 * AI 자동 생성과 직접 업로드 두 가지 방식 제공
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import CoverSelectionTab, {
  type CoverSelectionMode,
} from "./CoverSelectionTab";
import AICoverSection from "./AICoverSection";
import ImageUploadSection from "./ImageUploadSection";
import { useAlbumCreationActions } from "@/stores/albumStore";
import { useAlbumMetaStore } from "@/stores/albumMetaStore";

interface NewCoverSelectionStepProps {
  selectedRecordings: string[];
  className?: string;
}

const NewCoverSelectionStep: React.FC<NewCoverSelectionStepProps> = ({
  selectedRecordings,
  className = "",
}) => {
  const [mode, setMode] = useState<CoverSelectionMode>("ai");

  // Store hooks
  const { setSelectedCoverUploadId, updateAlbumInfo } =
    useAlbumCreationActions();
  const { cover } = useAlbumMetaStore();

  // 이미지 업로드 완료 핸들러
  const handleUploadComplete = useCallback(
    (imageUrl: string) => {
      // albumMetaStore에서 uploadId 가져와서 albumStore에 저장
      if (cover.uploadId) {
        setSelectedCoverUploadId(cover.uploadId);
        updateAlbumInfo({ coverImageUrl: imageUrl });
      }
    },
    [cover.uploadId, setSelectedCoverUploadId, updateAlbumInfo]
  );

  return (
    <div className={`h-full ${className}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 페이지 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-3">커버 선택</h2>
          <p className="text-white/70">
            앨범 커버를 AI로 자동 생성하거나 직접 업로드할 수 있습니다
          </p>
        </motion.div>

        {/* 탭 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CoverSelectionTab mode={mode} onModeChange={setMode} />
        </motion.div>

        {/* 콘텐츠 영역 */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          {mode === "ai" ? (
            <AICoverSection selectedRecordings={selectedRecordings} />
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">
                  이미지 업로드
                </h3>
                <p className="text-white/60 text-sm">
                  원하는 이미지를 업로드해 앨범 커버로 사용하세요
                </p>
              </div>
              <ImageUploadSection onUploadComplete={handleUploadComplete} />
            </div>
          )}
        </motion.div>

        {/* 선택된 트랙 개수 표시 */}
        {selectedRecordings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-purple-300 text-sm font-medium">
                {selectedRecordings.length}곡 선택됨
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewCoverSelectionStep;
