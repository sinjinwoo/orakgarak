/**
 * Recommendation Drop Zone Component
 * 추천을 위한 단일 녹음본 드롭존
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Music, Target, Sparkles, Play, Pause, X } from 'lucide-react';
import { type Recording } from '../../types/recording';

interface RecommendationDropZoneProps {
  selectedRecording: Recording | null;
  onRemoveRecording: () => void;
  onPlayRecording: (recordingId: string) => void;
  currentPlayingId?: string;
  className?: string;
}

const RecommendationDropZone: React.FC<RecommendationDropZoneProps> = ({
  selectedRecording,
  onRemoveRecording,
  onPlayRecording,
  currentPlayingId,
  className = '',
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'recommendation-drop-zone',
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 재생 가능 여부 체크
  const isPlayable = selectedRecording && 
    (!!selectedRecording.url || !!selectedRecording.publicUrl || !!selectedRecording.audioUrl) && 
    (!selectedRecording.urlStatus || selectedRecording.urlStatus === 'SUCCESS');

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-900/30 backdrop-blur-xl border-2 border-dashed transition-all duration-300 rounded-2xl p-8 h-full flex flex-col items-center justify-center shadow-2xl ${
        isOver
          ? 'border-yellow-300 bg-yellow-500/10 shadow-2xl shadow-yellow-300/70'
          : selectedRecording
          ? 'border-pink-300/70 bg-gray-900/50 shadow-2xl shadow-pink-300/60'
          : 'border-cyan-300/70 shadow-2xl shadow-cyan-300/60'
      } ${className}`}
    >
      {selectedRecording ? (
        /* Selected Recording Display */
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-cyan-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-300/50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">추천용 녹음 선택됨</h3>
            <p className="text-white/60 text-sm">
              아래 녹음을 기반으로 추천을 받을 수 있습니다
            </p>
          </div>

          {/* Recording Card */}
          <div className="bg-white/5 border-2 border-pink-300/60 rounded-xl p-4 shadow-lg shadow-pink-300/50">
            <div className="flex items-center gap-4">
              {/* Album Art Placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-cyan-300 rounded-lg flex items-center justify-center shadow-lg shadow-pink-300/50">
                <Music className="w-6 h-6 text-white" />
              </div>

              {/* Recording Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">
                  {selectedRecording.title || '제목 없음'}
                </h4>
                <p className="text-white/60 text-sm truncate">
                  {selectedRecording.song?.artist || '아티스트 없음'}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-white/40 text-xs">
                    {formatDuration(selectedRecording.durationSeconds || selectedRecording.duration || 0)}
                  </span>
                  <span className="text-white/40 text-xs">
                    {new Date(selectedRecording.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => isPlayable ? onPlayRecording(String(selectedRecording.id)) : null}
                  disabled={!isPlayable}
                  className={`p-2 rounded-lg transition-colors ${
                    !isPlayable 
                      ? 'bg-white/5 opacity-50 cursor-not-allowed'
                      : currentPlayingId === String(selectedRecording.id)
                      ? 'bg-pink-400 text-white shadow-lg shadow-pink-400/50'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  title={!isPlayable ? '재생할 수 없는 녹음본입니다' : ''}
                >
                  {currentPlayingId === String(selectedRecording.id) ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  onClick={onRemoveRecording}
                  className="p-2 bg-red-400/20 text-red-300 rounded-lg hover:bg-red-400/30 transition-colors"
                  title="제거"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Hint */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400/20 to-cyan-300/20 border border-pink-300/40 rounded-lg">
              <Target className="w-4 h-4 text-pink-300" />
              <span className="text-sm text-white/80">추천 준비 완료!</span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Drop Zone */
        <div className="text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white/40" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            추천용 녹음 선택
          </h3>
          
          <p className="text-white/60 mb-6 max-w-md">
            달력에서 녹음본을 드래그하거나 클릭하여<br />
            이곳에 놓으면 추천을 받을 수 있습니다
          </p>

          {/* Drop Zone Visual */}
          <div className="flex items-center justify-center gap-4 text-white/40">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-dashed border-current rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-xs">드래그</span>
            </div>
            
            <div className="text-2xl">→</div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-cyan-300 rounded-lg flex items-center justify-center shadow-lg shadow-pink-300/50">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs">추천</span>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-6 p-3 bg-white/5 border border-cyan-300/40 rounded-lg">
            <p className="text-xs text-white/60">
              💡 추천은 1개의 녹음본만 사용합니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationDropZone;
