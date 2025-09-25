/**
 * Library Panel Component
 * 녹음 목록 패널 - 검색/필터/정렬 기능 포함
 */

import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Search, SortAsc, Music, Calendar } from 'lucide-react';
import RecordingCard from './RecordingCard';
import { type Recording } from '../../types/recording';

interface LibraryPanelProps {
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleRecording: (recordingId: string) => void;
  onPlayRecording: (recordingId: string) => void;
  currentPlayingId?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

type SortField = 'title' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const LibraryPanel: React.FC<LibraryPanelProps> = ({
  recordings,
  selectedRecordings,
  onToggleRecording,
  onPlayRecording,
  currentPlayingId,
  loading = false,
  error = null,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Droppable for drag and drop
  const { setNodeRef, isOver } = useDroppable({
    id: 'library-panel',
  });

  // Filter and sort recordings
  const filteredAndSortedRecordings = useMemo(() => {
    let filtered = recordings.filter((recording) => {
      const title = recording.song?.title || recording.title || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Sort recordings
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = (a.song?.title || '').toLowerCase();
          bValue = (b.song?.title || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [recordings, searchQuery, sortField, sortOrder]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-900/50 backdrop-blur-xl border-2 border-cyan-300/80 rounded-2xl p-6 h-full flex flex-col shadow-2xl shadow-cyan-300/50 ${
        isOver ? 'ring-2 ring-yellow-300 bg-yellow-500/5 shadow-2xl shadow-yellow-300/70' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Music className="w-5 h-5 text-cyan-300" />
          내 녹음 목록
        </h2>
        <p className="text-sm text-white/60">
          {recordings.length}개의 녹음 · {new Set(selectedRecordings).size}개 선택됨
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="제목으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border-2 border-cyan-300/60 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 focus:shadow-2xl focus:shadow-pink-300/60"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-white/60" />
          <span className="text-xs text-white/60">정렬:</span>
          <div className="flex gap-1">
            {[
              { field: 'createdAt' as SortField, label: '최신순', icon: Calendar },
              { field: 'title' as SortField, label: '제목순', icon: Music },
            ].map(({ field, label, icon: Icon }) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 flex items-center gap-1 ${
                  sortField === field
                    ? 'bg-pink-400 text-white shadow-2xl shadow-pink-400/70'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:shadow-2xl hover:shadow-cyan-300/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                {sortField === field && (
                  <span className="text-xs">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recording List */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-3 p-1">
          {filteredAndSortedRecordings.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            filteredAndSortedRecordings.map((recording) => {
              const recordingId = String(recording.id);
              return (
                <RecordingCard
                  key={recordingId}
                  recording={recording}
                  isSelected={selectedRecordings.includes(recordingId)}
                  isPlaying={currentPlayingId === recordingId}
                  variant="library"
                  onToggle={() => onToggleRecording(recordingId)}
                  onPlay={() => onPlayRecording(recordingId)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Drag hint */}
      <div className="mt-4 p-3 bg-white/5 border-2 border-pink-300/60 rounded-lg shadow-2xl shadow-pink-300/50">
        <p className="text-xs text-white/60 text-center">
          💡 녹음을 드래그해서 오른쪽 캔버스에 추가하세요
        </p>
      </div>
    </div>
  );
};

export default LibraryPanel;