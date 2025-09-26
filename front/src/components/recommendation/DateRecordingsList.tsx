/**
 * Date Recordings List Component
 * 선택된 날짜의 녹음본들을 리스트로 보여주는 컴포넌트
 */

import React, { useState } from 'react';
import { Music, Calendar, Search, Play, Pause } from 'lucide-react';
import {
  useDraggable,
} from '@dnd-kit/core';
import { type Recording } from '../../types/recording';

interface DateRecordingsListProps {
  selectedDate: Date | null;
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleRecording: (recordingId: string) => void;
  onPlayRecording: (recordingId: string) => void;
  currentPlayingId?: string;
  activeId?: string | null;
  className?: string;
}

const DateRecordingsList: React.FC<DateRecordingsListProps> = ({
  selectedDate,
  recordings,
  selectedRecordings,
  onToggleRecording,
  onPlayRecording,
  currentPlayingId,
  activeId,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const filteredRecordings = recordings.filter(recording => {
    const title = recording.song?.title || recording.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedCount = recordings.filter(r => 
    selectedRecordings.includes(String(r.id))
  ).length;

  return (
    <div className={`bg-gray-900/50 backdrop-blur-xl border-2 border-cyan-300/80 rounded-2xl p-4 h-full flex flex-col shadow-2xl shadow-cyan-300/50 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-300" />
            {selectedDate ? formatDate(selectedDate) : '날짜를 선택하세요'}
          </h2>
        </div>
        
        {selectedDate && (
          <p className="text-sm text-white/60">
            {recordings.length}개의 녹음 · {selectedCount}개 선택됨
          </p>
        )}
      </div>

      {/* Search */}
      {selectedDate && recordings.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-cyan-300/60 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-300 text-sm"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
          </div>
        </div>
      )}

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto">
        {!selectedDate ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 mb-2">날짜를 선택해주세요</p>
              <p className="text-white/40 text-sm">달력에서 녹음본이 있는 날짜를 클릭하세요</p>
            </div>
          </div>
        ) : recordings.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Music className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 mb-2">이 날짜에 녹음이 없습니다</p>
              <p className="text-white/40 text-sm">다른 날짜를 선택해보세요</p>
            </div>
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Search className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 mb-2">검색 결과가 없습니다</p>
              <p className="text-white/40 text-sm">다른 검색어를 시도해보세요</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecordings.map((recording) => {
              const recordingId = String(recording.id);
              return (
                <DraggableRecordingCard
                  key={recordingId}
                  id={recordingId}
                  recording={recording}
                  isSelected={selectedRecordings.includes(recordingId)}
                  isPlaying={currentPlayingId === recordingId}
                  isDragging={activeId === recordingId}
                  onToggle={() => onToggleRecording(recordingId)}
                  onPlay={() => onPlayRecording(recordingId)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedDate && recordings.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-xs text-white/60 text-center">
            💡 녹음본을 드래그하여 추천영역에 놓으세요
          </div>
        </div>
      )}
    </div>
  );
};

// Draggable Recording Card Component
interface DraggableRecordingCardProps {
  id: string;
  recording: Recording;
  isSelected: boolean;
  isPlaying: boolean;
  isDragging: boolean;
  onToggle: () => void;
  onPlay: () => void;
}

const DraggableRecordingCard: React.FC<DraggableRecordingCardProps> = ({
  id,
  recording,
  isSelected,
  isPlaying,
  isDragging,
  onToggle,
  onPlay,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingFromDnd } = useDraggable({
    id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const title = recording.title || '제목 없음';
  const duration = recording.durationSeconds || recording.duration || 0;
  const audioUrl = recording.url || recording.publicUrl || recording.audioUrl;
  const isPlayable = !!audioUrl && (!recording.urlStatus || recording.urlStatus === 'SUCCESS');
  
  // 재생 불가능한 이유 표시
  const getPlayabilityReason = () => {
    if (!audioUrl) return 'URL 없음';
    if (recording.urlStatus === 'FAILED') return '처리 실패';
    if (recording.urlStatus === 'PROCESSING') return '처리 중';
    if (recording.urlStatus === 'SUCCESS' || !recording.urlStatus) return '재생 가능';
    return '알 수 없음';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group relative bg-gray-800/40 border border-cyan-300/60 rounded-lg p-3
        transition-all duration-200 cursor-grab active:cursor-grabbing shadow-lg shadow-cyan-300/30
        ${isSelected ? 'ring-2 ring-yellow-300 bg-yellow-500/10 shadow-2xl shadow-yellow-300/70 border-yellow-300' : 'hover:bg-gray-800/60 hover:border-pink-300/60 hover:shadow-2xl hover:shadow-pink-300/60'}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
      onClick={onToggle}
      onDoubleClick={onPlay}
    >
      <div className="flex items-center gap-3">
        {/* Album art placeholder */}
        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Music className="w-5 h-5 text-white/40" />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-white/50">{formatDuration(duration)}</span>
            <span className="text-white/40">
              {new Date(recording.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isPlayable) {
              onPlay();
            }
          }}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-200 ${
            isPlayable ? 'bg-white/10 hover:bg-yellow-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'
          }`}
          disabled={!isPlayable}
          title={isPlayable ? '재생' : `재생 불가: ${getPlayabilityReason()}`}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-yellow-300" />
          ) : (
            <Play className={`w-3 h-3 ${isPlayable ? 'text-white/70' : 'text-white/30'}`} />
          )}
        </button>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/70" />
      )}
    </div>
  );
};

export default DateRecordingsList;
