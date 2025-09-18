/**
 * ReservationQueue - 완전 순수 HTML/CSS 예약 큐 컴포넌트
 * MUI Box 자동 생성 CSS 완전 제거 버전
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

const SortableReservationItem: React.FC<{ 
  song: Song; 
  index: number; 
  onDelete: (songId: string) => void; 
  onSelect: (song: Song) => void;
  isSelected?: boolean;
}> = ({ song, index, onDelete, onSelect, isSelected = false }) => {
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
        gap: '12px',
        padding: '12px',
        marginBottom: '8px',
        background: isSelected ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 128, 0.1)',
        border: isSelected ? '1px solid rgba(0, 255, 255, 0.5)' : '1px solid rgba(255, 0, 128, 0.3)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected ? '0 0 15px rgba(0, 255, 255, 0.3)' : 'none'
      }}
      onClick={() => onSelect(song)}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 0, 128, 0.15)';
          e.currentTarget.style.border = '1px solid rgba(255, 0, 128, 0.5)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 0, 128, 0.1)';
          e.currentTarget.style.border = '1px solid rgba(255, 0, 128, 0.3)';
          e.currentTarget.style.boxShadow = 'none';
        }
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
          width: '20px',
          height: '20px',
          color: '#ff0080',
          cursor: 'grab',
          fontSize: '12px',
          flexShrink: 0
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
        }}
      >
        ⋮⋮
      </div>

      {/* 순서 번호 */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #ff0080, #00ffff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        flexShrink: 0
      }}>
        {index + 1}
      </div>

      {/* 곡 아이콘 */}
      <div style={{
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #00ffff, #ff0080)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0
      }}>
        🎵
      </div>

      {/* 곡 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          margin: '0 0 4px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {song.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#00ffff', fontSize: '0.8rem' }}>
            {song.artist}
          </span>
          <span style={{
            background: 'rgba(0, 255, 255, 0.2)',
            color: '#00ffff',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block'
          }}>
            {song.albumName}
          </span>
          <span style={{ color: '#888', fontSize: '0.7rem' }}>
            {song.duration}
          </span>
        </div>
      </div>

      {/* 삭제 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={(e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 방지
            onDelete(song.id.toString());
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4444',
            cursor: 'pointer',
            padding: '6px',
            fontSize: '14px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
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
  const { 
    reservationQueue, 
    selectedSong,
    removeFromQueue, 
    clearQueue, 
    reorderQueue,
    selectSong
  } = useReservation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = reservationQueue.findIndex((song) => song.id === active.id);
      const newIndex = reservationQueue.findIndex((song) => song.id === over?.id);

      reorderQueue(oldIndex, newIndex);
    }
  };

  const handleDeleteSong = (songId: string) => {
    removeFromQueue(parseInt(songId));
  };

  const handleSelectSong = (song: Song) => {
    selectSong(song);
  };

  const handleClearAll = () => {
    if (window.confirm('모든 예약을 삭제하시겠습니까?')) {
      clearQueue();
    }
  };

  return (
    <div style={{ height: '100%' }}>
      {/* 사이버펑크 스크롤바 스타일 */}
      <style dangerouslySetInnerHTML={{ 
        __html: `
          .queue-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .queue-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
          }
          .queue-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #ff0080, #00ffff);
            border-radius: 4px;
            border: 1px solid rgba(255, 0, 128, 0.3);
          }
          .queue-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #cc0066, #00cccc);
            box-shadow: 0 0 10px rgba(255, 0, 128, 0.5);
          }
        `
      }} />
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '35px',
            height: '35px',
            borderRadius: '8px',
            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🎵
          </div>
          <div>
            <h3 style={{
              color: '#ff0080',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              textShadow: '0 0 10px rgba(255, 0, 128, 0.5)'
            }}>
              NEURAL QUEUE
            </h3>
            <p style={{
              color: '#888',
              fontSize: '0.8rem',
              margin: '0',
              textTransform: 'uppercase'
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
            padding: '4px 8px',
            borderRadius: '10px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
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
                padding: '6px 10px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
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
            <div 
              className="queue-scrollbar"
              style={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                paddingRight: '4px' // 스크롤바 공간 확보
              }}
            >
              {reservationQueue.map((song, index) => (
                <SortableReservationItem
                  key={song.id}
                  song={song}
                  index={index}
                  onDelete={handleDeleteSong}
                  onSelect={handleSelectSong}
                  isSelected={selectedSong?.id === song.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#888'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 0, 128, 0.1)',
            border: '2px dashed rgba(255, 0, 128, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '30px'
          }}>
            🎵
          </div>
          <h4 style={{
            color: '#ff0080',
            fontSize: '1rem',
            fontWeight: 'bold',
            margin: '0 0 8px 0'
          }}>
            NO RESERVATIONS
          </h4>
          <p style={{
            color: '#888',
            fontSize: '0.8rem',
            margin: '0'
          }}>
            검색한 곡을 예약해보세요
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationQueue;