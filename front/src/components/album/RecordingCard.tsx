/**
 * Recording Card Component
 * 드래그 가능한 녹음 카드 - 리스트/캔버스에서 공용 사용
 */

import React, { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pause, GripVertical, X, Music } from 'lucide-react';

export interface Recording {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  createdAt: string;
  url?: string;
  audioUrl?: string;
  analysis?: {
    overallScore: number;
  };
  song?: {
    title: string;
    artist: string;
  };
  duration?: number;
}

interface RecordingCardProps {
  recording: Recording;
  isSelected?: boolean;
  isPlaying?: boolean;
  isDragging?: boolean;
  showHandle?: boolean;
  showRemove?: boolean;
  variant?: 'library' | 'canvas';
  order?: number;
  onToggle?: () => void;
  onPlay?: () => void;
  onRemove?: () => void;
  className?: string;
}

const RecordingCard = forwardRef<HTMLDivElement, RecordingCardProps>(({
  recording,
  isSelected = false,
  isPlaying = false,
  isDragging = false,
  showHandle = false,
  showRemove = false,
  variant = 'library',
  order,
  onToggle,
  onPlay,
  onRemove,
  className = '',
  ...props
}, ref) => {
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const title = recording.song?.title || recording.title;
  const artist = recording.song?.artist || recording.artist;
  const duration = recording.duration || recording.durationSec;
  const score = recording.analysis?.overallScore || 0;

  return (
    <div
      ref={ref}
      className={`
        group relative bg-gray-800/50 border border-white/10 rounded-xl p-4
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-fuchsia-400 bg-fuchsia-500/10' : 'hover:bg-gray-800/70 hover:border-white/20'}
        ${isDragging ? 'shadow-2xl shadow-fuchsia-500/20 scale-105 z-50' : ''}
        ${variant === 'canvas' ? 'bg-gray-800/70' : ''}
        ${className}
      `}
      onClick={onToggle}
      onDoubleClick={onPlay}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${title} by ${artist}`}
      tabIndex={0}
      {...props}
    >
      {/* Drag handle */}
      {showHandle && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-white/40 group-hover:text-white/60" />
        </div>
      )}

      {/* Order number for canvas */}
      {variant === 'canvas' && order && (
        <div className="absolute left-4 top-4 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {order}
        </div>
      )}

      {/* Main content */}
      <div className={`flex items-center gap-4 ${showHandle ? 'ml-6' : ''} ${variant === 'canvas' && order ? 'ml-10' : ''}`}>
        {/* Album art placeholder */}
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Music className="w-5 h-5 text-white/40" />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{title}</h3>
          <p className="text-sm text-white/60 truncate">{artist}</p>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-white/50">{formatDuration(duration)}</span>
            {score > 0 && (
              <span className={`font-medium ${getScoreColor(score)}`}>
                {score}점
              </span>
            )}
            <span className="text-white/40">
              {new Date(recording.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Play button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            className="w-8 h-8 bg-white/10 hover:bg-fuchsia-500/20 rounded-lg flex items-center justify-center transition-colors duration-200"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-fuchsia-400" />
            ) : (
              <Play className="w-4 h-4 text-white/70" />
            )}
          </button>

          {/* Remove button */}
          {showRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="w-8 h-8 bg-white/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors duration-200 opacity-0 group-hover:opacity-100"
              aria-label="제거"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-fuchsia-400 rounded-full" />
      )}
    </div>
  );
});

RecordingCard.displayName = 'RecordingCard';

// Sortable wrapper for use in canvas
export const SortableRecordingCard: React.FC<RecordingCardProps & { id: string }> = ({ id, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div style={style} {...attributes} {...listeners}>
      <RecordingCard
        ref={setNodeRef}
        {...props}
        isDragging={isDragging}
        showHandle={true}
        variant="canvas"
      />
    </div>
  );
};

export default RecordingCard;