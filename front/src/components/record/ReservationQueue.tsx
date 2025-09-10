/**
 * 예약 큐 컴포넌트
 * - 예약된 곡들의 목록을 표시하고 관리
 * - 드래그 앤 드롭으로 곡 순서 변경 가능
 * - 개별 곡 삭제 및 전체 삭제 기능
 * - 다음 곡 재생 기능
 * - 곡 순서 번호 표시 및 시각적 피드백
 * - 나중에 Redis와 연동하여 실제 예약 데이터를 관리할 예정
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
  Paper
} from '@mui/material';
import { 
  MusicNote, 
  Delete, 
  PlayArrow, 
  ClearAll,
  DragIndicator
} from '@mui/icons-material';
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

// 드래그 앤 드롭이 가능한 개별 곡 아이템 컴포넌트
const SortableItem: React.FC<{ 
  song: Song; 
  index: number; 
  onRemove: (id: number) => void; 
  onPlayNext: (song: Song) => void 
}> = ({ song, index, onRemove, onPlayNext }) => {
  // 드래그 앤 드롭 관련 훅들
  const {
    attributes,    // 드래그 가능한 요소의 속성
    listeners,     // 드래그 이벤트 리스너
    setNodeRef,    // 드래그 가능한 요소의 ref
    transform,     // 드래그 중 변환 정보
    transition,    // 애니메이션 전환 정보
    isDragging,    // 현재 드래그 중인지 여부
  } = useSortable({ id: song.id });

  // 드래그 중일 때의 스타일 적용
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,  // 드래그 중일 때 투명도 변경
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        mb: 1,
        backgroundColor: 'white',
        '&:hover': {
          backgroundColor: 'grey.50',
        }
      }}
    >
      {/* 드래그 핸들 */}
      <Box
        {...attributes}
        {...listeners}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: 1,
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          }
        }}
      >
        <DragIndicator color="action" />
      </Box>

      {/* 곡 아이콘 */}
      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
        <MusicNote />
      </Avatar>

      {/* 곡 정보 */}
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {song.title}
            </Typography>
            {/* 순서 번호 표시 */}
            <Chip 
              label={`#${index + 1}`} 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {song.artist}
            </Typography>
            <Chip 
              label={song.genre} 
              size="small" 
              variant="outlined"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              {song.duration}
            </Typography>
          </Box>
        }
      />

      {/* 액션 버튼들 */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* 다음 곡으로 재생 버튼 */}
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => onPlayNext(song)}
          title="다음 곡으로 재생"
        >
          <PlayArrow />
        </IconButton>
        {/* 예약에서 제거 버튼 */}
        <IconButton 
          size="small" 
          color="error"
          onClick={() => onRemove(song.id)}
          title="예약에서 제거"
        >
          <Delete />
        </IconButton>
      </Box>
    </ListItem>
  );
};

const ReservationQueue: React.FC = () => {
  // 예약 큐 관련 상태와 함수들 가져오기
  const { 
    reservationQueue,    // 현재 예약된 곡 목록
    removeFromQueue,     // 특정 곡 제거 함수
    reorderQueue,        // 곡 순서 변경 함수
    clearQueue          // 전체 삭제 함수
  } = useReservation();

  // 드래그 앤 드롭 센서 설정 (마우스와 키보드 지원)
  const sensors = useSensors(
    useSensor(PointerSensor),  // 마우스/터치 드래그
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,  // 키보드 네비게이션
    })
  );

  // 드래그 앤 드롭 완료 시 호출되는 함수
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // 드롭 위치가 유효하고 다른 위치로 이동한 경우에만 처리
    if (over && active.id !== over.id) {
      const oldIndex = reservationQueue.findIndex((song) => song.id === active.id);
      const newIndex = reservationQueue.findIndex((song) => song.id === over.id);

      // 유효한 인덱스인지 확인 후 순서 변경
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`드래그 앤 드롭: ${oldIndex} → ${newIndex}`);
        reorderQueue(oldIndex, newIndex);
      } else {
        console.warn('유효하지 않은 드래그 앤 드롭 인덱스:', { oldIndex, newIndex });
      }
    }
  };

  // 다음 곡으로 재생하는 함수
  const handlePlayNext = (song: Song) => {
    console.log('다음 곡으로 재생:', song.title, '-', song.artist);
    
    // 선택된 곡을 큐의 맨 앞으로 이동
    const currentIndex = reservationQueue.findIndex(s => s.id === song.id);
    if (currentIndex > 0) {
      reorderQueue(currentIndex, 0);
      console.log(`${song.title}을(를) 큐의 맨 앞으로 이동했습니다.`);
    }
    
    // TODO: 실제 재생 로직 구현
    // - 현재 재생 중인 곡이 있다면 중지
    // - 선택된 곡 재생 시작
    // - 재생 상태 UI 업데이트
  };

  return (
    <Box>
      {/* 헤더: 제목과 전체 삭제 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          예약 큐 ({reservationQueue.length})
        </Typography>
        {reservationQueue.length > 0 && (
          <Button
            size="small"
            color="error"
            startIcon={<ClearAll />}
            onClick={clearQueue}
            sx={{ fontSize: '0.75rem' }}
          >
            전체 삭제
          </Button>
        )}
      </Box>

      {/* 예약된 곡이 없을 때의 빈 상태 */}
      {reservationQueue.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <MusicNote sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            예약된 곡이 없습니다.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            곡을 검색하여 예약 큐에 추가하세요.
          </Typography>
        </Paper>
      ) : (
        /* 드래그 앤 드롭 컨텍스트로 감싸진 예약 큐 목록 */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={reservationQueue.map(song => song.id)}
            strategy={verticalListSortingStrategy}
          >
            <List
              sx={{ 
                maxHeight: 400, 
                overflow: 'auto'
              }}
            >
              {reservationQueue.map((song, index) => (
                <SortableItem
                  key={song.id}
                  song={song}
                  index={index}
                  onRemove={removeFromQueue}
                  onPlayNext={handlePlayNext}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      )}

      {/* 하단 정보: 사용법 안내와 곡 개수 */}
      {reservationQueue.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              💡 드래그하여 순서를 변경할 수 있습니다
            </Typography>
            <Typography variant="caption" color="text.secondary">
              총 {reservationQueue.length}곡
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ReservationQueue;
