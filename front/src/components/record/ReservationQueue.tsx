/**
 * 예약 큐 컴포넌트 - 순수 HTML/CSS
 * - 예약된 곡들의 목록을 표시하고 관리
 * - 드래그 앤 드롭으로 곡 순서 변경 가능
 * - 개별 곡 삭제 및 전체 삭제 기능
 * - 다음 곡 재생 기능
 * - 곡 순서 번호 표시 및 시각적 피드백
 * - 나중에 Redis와 연동하여 실제 예약 데이터를 관리할 예정
 */

import React from 'react';
import { useReservation } from '../../hooks/useReservation';
import type { Song } from '../../types/song';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 정렬 가능한 예약 아이템 컴포넌트
const SortableReservationItem: React.FC<{ song: Song; index: number; onDelete: (songId: string) => void; onPlay: (song: Song) => void }> = ({ song, index, onDelete, onPlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        marginBottom: '8px',
        background: 'rgba(255, 0, 128, 0.1)',
        border: '1px solid rgba(255, 0, 128, 0.3)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 0, 128, 0.15)';
        e.currentTarget.style.border = '1px solid rgba(255, 0, 128, 0.5)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 0, 128, 0.1)';
        e.currentTarget.style.border = '1px solid rgba(255, 0, 128, 0.3)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          color: '#ff0080',
          cursor: 'grab',
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 0, 128, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 128, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ⋮⋮
      </div>

      {/* 순서 번호 */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #ff0080, #00ffff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        fontWeight: 700,
        fontSize: '0.875rem',
        boxShadow: '0 0 10px rgba(255, 0, 128, 0.3)',
        flexShrink: 0
      }}>
        {index + 1}
      </div>

      {/* 곡 아이콘 */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #00ffff, #ff0080)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '20px', color: '#000' }}>🎵</span>
      </div>

      {/* 곡 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h6 style={{ 
          color: '#fff',
          fontWeight: 600,
          margin: '0 0 4px 0',
          fontSize: '1rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {song.title}
        </h6>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ 
            color: '#00ffff',
            fontSize: '0.875rem'
          }}>
            {song.artist}
          </span>
          <span style={{
            background: 'rgba(0, 255, 255, 0.2)',
            color: '#00ffff',
            border: '1px solid #00ffff',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {song.genre}
          </span>
          <span style={{ 
            color: '#888',
            fontSize: '0.75rem'
          }}>
            {song.duration}
          </span>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* 재생 버튼 */}
        <button
          onClick={() => onPlay(song)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffff',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '20px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ▶️
        </button>

        {/* 삭제 버튼 */}
        <button
          onClick={() => onDelete(song.id.toString())}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4444',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '18px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

const ReservationQueue: React.FC = () => {
  const { reservationQueue, removeFromQueue, clearQueue, reorderQueue } = useReservation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = reservationQueue.findIndex((song) => song.id === active.id);
      const newIndex = reservationQueue.findIndex((song) => song.id === over?.id);

      reorderQueue(oldIndex, newIndex);
    }
  };

  // 개별 곡 삭제
  const handleDeleteSong = (songId: string) => {
    removeFromQueue(parseInt(songId));
  };

  // 곡 재생 (다음 곡으로 설정)
  const handlePlaySong = (song: Song) => {
    // 여기에 실제 재생 로직 구현
    console.log('Playing song:', song);
  };

  // 전체 삭제
  const handleClearAll = () => {
    if (window.confirm('모든 예약을 삭제하시겠습니까?')) {
      clearQueue();
    }
  };

  return (
    <div style={{ minHeight: '500px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 0, 128, 0.3)'
          }}>
            <span style={{ fontSize: '20px', color: '#000' }}>🎵</span>
          </div>
          <div>
            <h6 style={{ 
              color: '#ff0080',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textShadow: '0 0 10px rgba(255, 0, 128, 0.5)',
              margin: 0,
              fontSize: '1.25rem'
            }}>
              NEURAL QUEUE
            </h6>
            <p style={{ 
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: 0,
              fontSize: '0.75rem'
            }}>
              RESERVATION SYSTEM
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(255, 0, 128, 0.2)',
            color: '#ff0080',
            border: '1px solid #ff0080',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem'
          }}>
            {reservationQueue.length} SONGS
          </span>
          
          {reservationQueue.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'rgba(255, 68, 68, 0.2)',
                color: '#ff4444',
                border: '1px solid #ff4444',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* 예약 목록 */}
      {reservationQueue.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={reservationQueue.map(song => song.id)} strategy={verticalListSortingStrategy}>
            <div>
              {reservationQueue.map((song, index) => (
                <SortableReservationItem
                  key={song.id}
                  song={song}
                  index={index}
                  onDelete={handleDeleteSong}
                  onPlay={handlePlaySong}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // 빈 상태 메시지
        <div style={{ 
          textAlign: 'center',
          padding: '40px 20px',
          color: '#888'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 0, 128, 0.1)',
            border: '2px dashed rgba(255, 0, 128, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '40px'
          }}>
            🎵
          </div>
          <h6 style={{ 
            color: '#ff0080',
            fontWeight: 600,
            margin: '0 0 8px 0',
            fontSize: '1.125rem'
          }}>
            NO RESERVATIONS
          </h6>
          <p style={{ 
            color: '#888',
            margin: 0,
            fontSize: '0.875rem'
          }}>
            검색한 곡을 예약해보세요
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationQueue;