/**
 * Track Canvas Component
 * 드래그앤드롭 트랙 캔버스 - 정렬/삭제 기능 포함
 */

import React, { useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Music, Plus } from 'lucide-react';
import { SortableRecordingCard } from './RecordingCard';
import { type Recording } from '../../types/recording';

interface CanvasTrack extends Recording {
  order: number;
}

interface TrackCanvasProps {
  tracks: CanvasTrack[];
  onTracksReorder: (tracks: CanvasTrack[]) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackAdd: (recording: Recording) => void;
  onPlayTrack: (trackId: string) => void;
  currentPlayingId?: string | null;
  maxTracks?: number;
  className?: string;
}

const TrackCanvas: React.FC<TrackCanvasProps> = ({
  tracks,
  onTracksReorder,
  onTrackRemove,
  onPlayTrack,
  currentPlayingId,
  maxTracks = 10,
  className = '',
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Droppable for the canvas
  const { setNodeRef, isOver } = useDroppable({
    id: 'track-canvas',
  });

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeElement = document.activeElement as HTMLElement;
        const trackId = activeElement?.getAttribute('data-track-id');
        if (trackId) {
          onTrackRemove(trackId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTrackRemove]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Handle drop from library to canvas
    if (over.id === 'track-canvas' && !tracks.find(t => t.id === active.id)) {
      // This will be handled in handleDragEnd
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle drop from library to canvas
    if (over.id === 'track-canvas') {
      const activeTrack = tracks.find(t => t.id === active.id);
      if (!activeTrack) {
        // This is a new recording being added from library
        // The actual addition will be handled by the parent component
        return;
      }
    }

    // Handle reordering within canvas
    if (active.id !== over.id) {
      const oldIndex = tracks.findIndex(track => track.id === active.id);
      const newIndex = tracks.findIndex(track => track.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTracks = [...tracks];
        const [movedTrack] = newTracks.splice(oldIndex, 1);
        newTracks.splice(newIndex, 0, movedTrack);

        // Update order numbers
        const reorderedTracks = newTracks.map((track, index) => ({
          ...track,
          order: index + 1,
        }));

        onTracksReorder(reorderedTracks);
      }
    }
  };

  const activeTrack = tracks.find(track => String(track.id) === activeId);

  // Calculate total duration
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={setNodeRef}
        className={`bg-gray-900/30 backdrop-blur-xl border-2 border-solid transition-all duration-300 rounded-2xl p-6 h-full flex flex-col shadow-2xl ${
          isOver
            ? 'border-yellow-300 bg-yellow-500/10 shadow-2xl shadow-yellow-300/70'
            : tracks.length === 0
            ? 'border-cyan-300/70 shadow-2xl shadow-cyan-300/60'
            : 'border-pink-300/70 bg-gray-900/50 shadow-2xl shadow-pink-300/60'
        } ${className}`}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-300" />
              트랙 구성
            </h2>
            <div className="text-sm text-white/60">
              {tracks.length}/{maxTracks} 트랙
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>총 길이: {formatTotalDuration(totalDuration)}</span>
            {tracks.length >= maxTracks && (
              <span className="text-yellow-400 font-medium">최대 트랙 수 도달</span>
            )}
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {tracks.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-white/60 font-medium mb-2">트랙 캔버스</h3>
              <p className="text-white/40 text-sm mb-4 max-w-xs">
                왼쪽에서 녹음본을 끌어다 놓아서<br />
                앨범 트랙을 구성해보세요
              </p>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <Music className="w-4 h-4" />
                <span>최대 {maxTracks}곡까지 추가 가능</span>
              </div>
            </div>
          ) : (
            /* Track List */
            <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 p-1">
                {tracks.map((track) => (
                  <SortableRecordingCard
                    key={track.id}
                    id={track.id}
                    recording={track}
                    order={track.order}
                    isPlaying={currentPlayingId === String(track.id)}
                    showRemove={true}
                    onPlay={() => onPlayTrack(String(track.id))}
                    onRemove={() => onTrackRemove(String(track.id))}
                    data-track-id={String(track.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTrack ? (
                <div className="transform scale-105 opacity-90 rotate-2 shadow-2xl">
                  <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-yellow-300/70 rounded-xl p-4 min-w-[300px] shadow-lg shadow-yellow-300/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-200 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-yellow-300/70">
                        {activeTrack.order}
                      </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {activeTrack.song?.title || '제목 없음'}
                  </div>
                  <div className="text-white/60 text-sm">
                    {activeTrack.song?.artist || '아티스트 없음'}
                  </div>
                </div>
                <div className="text-white/60 text-sm">
                  {Math.floor((activeTrack.duration || 0) / 60)}:{(activeTrack.duration || 0) % 60 < 10 ? '0' : ''}{(activeTrack.duration || 0) % 60}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TrackCanvas;