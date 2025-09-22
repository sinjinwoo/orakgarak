/**
 * New Recording Selection Stage with Drag & Drop
 * 드래그앤드롭이 포함된 새로운 녹음 선택 단계
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import LibraryPanel from './LibraryPanel';
import TrackCanvas from './TrackCanvas';
import { type Recording } from '../../types/recording';

interface Track extends Recording {
  order: number;
  // UI에서 필요한 추가 필드들
  title?: string;
  artist?: string;
  durationSec?: number;
}

interface NewRecordingSelectionStepProps {
  recordings: Recording[];
  selectedRecordings: string[];
  loading?: boolean;
  error?: string | null;
  onToggleRecording: (recordingId: string) => void;
  onAddToast?: (toast: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
  className?: string;
}

const NewRecordingSelectionStep: React.FC<NewRecordingSelectionStepProps> = ({
  recordings,
  selectedRecordings,
  loading = false,
  error = null,
  onToggleRecording,
  onAddToast,
  className = '',
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const normalizeId = (id: string | number): string => String(id).trim();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  React.useEffect(() => {
    const normalizedSelectedIds = new Set(selectedRecordings.map(normalizeId));
    const newTracks = recordings
      .filter(recording => normalizedSelectedIds.has(normalizeId(recording.id)))
      .map((recording, index) => ({
        ...recording,
        order: index + 1,
        durationSec: recording.duration || 0,
      }));
    setTracks(newTracks);
  }, [recordings, selectedRecordings]);

  // Handle track reordering
  const handleTracksReorder = useCallback((reorderedTracks: Track[]) => {
    setTracks(reorderedTracks);
    // Update selected recordings order
    const newSelectedRecordings = reorderedTracks.map(track => track.id);
    // This would need to be implemented in the parent component to maintain order
    // For now, we'll just keep the tracks state in sync
  }, []);

  const handleTrackRemove = useCallback((trackId: string) => {
    onToggleRecording(normalizeId(trackId));

    onAddToast?.({
      type: 'info',
      message: '트랙이 제거되었습니다.',
    });
  }, [onToggleRecording, onAddToast]);

  const handleTrackAdd = useCallback((recording: Recording) => {
    if (selectedRecordings.length >= 10) {
      onAddToast?.({
        type: 'warning',
        message: '최대 10곡까지만 선택할 수 있습니다.',
      });
      return;
    }

    onToggleRecording(normalizeId(recording.id));
    onAddToast?.({
      type: 'success',
      message: `"${recording.song?.title || ''}"이(가) 추가되었습니다.`,
    });
  }, [selectedRecordings.length, onToggleRecording, onAddToast]);

  // Handle play/pause
  const handlePlayToggle = useCallback((recordingId: string) => {
    setCurrentPlayingId(prev => prev === recordingId ? null : recordingId);
    // TODO: Implement actual audio playback
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (over.id === 'track-canvas' && !tracks.find(t => normalizeId(t.id) === normalizeId(active.id))) {
      const recording = recordings.find(r => normalizeId(r.id) === normalizeId(active.id));
      if (recording && !selectedRecordings.some(id => normalizeId(id) === normalizeId(recording.id))) {
        handleTrackAdd(recording);
      }
    }
  }, [tracks, recordings, selectedRecordings, handleTrackAdd]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over events if needed
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className={`h-full ${className}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">녹음 선택</h1>
          <p className="text-white/70">
            앨범에 포함할 녹음을 선택하고 순서를 조정해보세요.
            드래그앤드롭으로 쉽게 추가할 수 있습니다.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[400px_1fr] gap-6 h-[calc(100%-120px)]">
          {/* Left: Library Panel */}
          <LibraryPanel
            recordings={recordings}
            selectedRecordings={selectedRecordings}
            onToggleRecording={(id) => onToggleRecording(normalizeId(id))}
            onPlayRecording={handlePlayToggle}
            currentPlayingId={currentPlayingId}
            loading={loading}
            error={error}
          />

          {/* Right: Track Canvas */}
          <TrackCanvas
            tracks={tracks}
            onTracksReorder={handleTracksReorder}
            onTrackRemove={handleTrackRemove}
            onTrackAdd={handleTrackAdd}
            onPlayTrack={handlePlayToggle}
            currentPlayingId={currentPlayingId}
            maxTracks={10}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-4">
            <span>선택된 트랙: {new Set(selectedRecordings).size}/10</span>
            <span>
              총 길이: {Math.floor(tracks.reduce((sum, track) => sum + (track.duration || track.durationSec || 0), 0) / 60)}분
            </span>
          </div>
          <div className="text-xs text-white/40">
            💡 팁: 트랙을 드래그해서 순서를 바꿀 수 있습니다
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default NewRecordingSelectionStep;