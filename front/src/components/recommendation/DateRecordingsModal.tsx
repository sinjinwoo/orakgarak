/**
 * Date Recordings Modal Component
 * 특정 날짜의 녹음본들을 보여주는 모달 컴포넌트
 */

import React, { useState } from 'react';
import { X, Play, Pause, Music, Calendar } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
} from '@dnd-kit/core';
import RecordingCard from '../album/RecordingCard';
import { type Recording } from '../../types/recording';

interface DateRecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleRecording: (recordingId: string) => void;
  onPlayRecording: (recordingId: string) => void;
  onDragToDropZone?: (recording: Recording) => void;
  currentPlayingId?: string;
}

const DateRecordingsModal: React.FC<DateRecordingsModalProps> = ({
  isOpen,
  onClose,
  date,
  recordings,
  selectedRecordings,
  onToggleRecording,
  onPlayRecording,
  onDragToDropZone,
  currentPlayingId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const recording = recordings.find(r => String(r.id) === active.id);
    if (recording && onDragToDropZone) {
      onDragToDropZone(recording);
      onClose(); // 드래그 후 모달 닫기
    }
  };

  if (!isOpen) return null;

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-gray-900/95 backdrop-blur-xl border-2 border-cyan-300/80 rounded-2xl p-4 max-w-md w-full mx-4 max-h-[60vh] shadow-2xl shadow-cyan-300/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-300" />
              <div>
                <h2 className="text-lg font-bold text-white">
                  {formatDate(date)}
                </h2>
                <p className="text-xs text-white/60">
                  {recordings.length}개 녹음 · {selectedCount}개 선택됨
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-cyan-300/60 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-300 text-sm"
              />
              <Music className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
            </div>
          </div>

          {/* Recordings List */}
          <div className="max-h-[35vh] overflow-y-auto space-y-2">
            {filteredRecordings.length === 0 ? (
              <div className="text-center py-6 text-white/40">
                <Music className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? '검색 결과가 없습니다' : '이 날짜에 녹음이 없습니다'}
                </p>
              </div>
            ) : (
              filteredRecordings.map((recording) => {
                const recordingId = String(recording.id);
                return (
                  <DraggableRecordingCard
                    key={recordingId}
                    id={recordingId}
                    recording={recording}
                    isSelected={selectedRecordings.includes(recordingId)}
                    isPlaying={currentPlayingId === recordingId}
                    onToggle={() => onToggleRecording(recordingId)}
                    onPlay={() => onPlayRecording(recordingId)}
                  />
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">
                💡 드래그하여 추천영역에 놓으세요
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-gradient-to-r from-pink-300 to-cyan-300 hover:from-pink-400 hover:to-cyan-400 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-pink-300/40"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

// Draggable Recording Card Component
interface DraggableRecordingCardProps {
  id: string;
  recording: Recording;
  isSelected: boolean;
  isPlaying: boolean;
  onToggle: () => void;
  onPlay: () => void;
}

const DraggableRecordingCard: React.FC<DraggableRecordingCardProps> = ({
  id,
  recording,
  isSelected,
  isPlaying,
  onToggle,
  onPlay,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
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

  const title = recording.song?.title || recording.title || '제목 없음';
  const duration = recording.duration || recording.durationSeconds || 0;
  const isPlayable = !!recording.url && (!recording.urlStatus || recording.urlStatus === 'SUCCESS');

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
        ${isDragging ? 'shadow-2xl shadow-yellow-300/70 scale-105 z-50' : ''}
      `}
      onClick={onToggle}
      onDoubleClick={onPlay}
    >
      <div className="flex items-center gap-3">
        {/* Album art placeholder */}
        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Music className="w-4 h-4 text-white/40" />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate text-sm">{title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs">
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
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-200 ${
            isPlayable ? 'bg-white/10 hover:bg-yellow-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'
          }`}
          disabled={!isPlayable}
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
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/70" />
      )}
    </div>
  );
};

export default DateRecordingsModal;
