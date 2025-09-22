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
  onTrackAdd,
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

  const activeTrack = tracks.find(track => track.id === activeId);

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
        className={`bg-gray-900/30 backdrop-blur-xl border-2 border-dashed transition-all duration-300 rounded-2xl p-6 h-full flex flex-col ${
          isOver
            ? 'border-fuchsia-400 bg-fuchsia-500/10'
            : tracks.length === 0
            ? 'border-white/20'
            : 'border-white/10 bg-gray-900/50'
        } ${className}`}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-fuchsia-400" />
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
        <div className="flex-1 overflow-auto">
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
              <div className="space-y-3">
                {tracks.map((track) => (
                  <SortableRecordingCard
                    key={track.id}
                    id={track.id}
                    recording={track}
                    order={track.order}
                    isPlaying={currentPlayingId === track.id}
                    showRemove={true}
                    onPlay={() => onPlayTrack(track.id)}
                    onRemove={() => onTrackRemove(track.id)}
                    data-track-id={track.id}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>

        {/* Footer Instructions */}
        {tracks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-xs text-white/50">
              <div>
                <span className="font-medium">드래그:</span> 순서 변경
              </div>
              <div>
                <span className="font-medium">Del 키:</span> 트랙 삭제
              </div>
              <div>
                <span className="font-medium">더블클릭:</span> 미리 듣기
              </div>
              <div>
                <span className="font-medium">X 버튼:</span> 트랙 제거
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTrack ? (
          <div className="transform scale-105 opacity-90">
            <SortableRecordingCard
              id={activeTrack.id}
              recording={activeTrack}
              order={activeTrack.order}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TrackCanvas;