/**
 * 예약 큐 상태 관리를 위한 Context
 * - 곡 예약, 제거, 순서 변경, 전체 삭제 기능 제공
 * - 전역 상태로 예약 큐 데이터를 관리
 * - 나중에 Redis 연동 시 이 Context의 로직을 API 호출로 대체 예정
 */

import React, { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Song } from '../types/song';

// Context에서 제공할 함수들의 타입 정의
interface ReservationContextType {
  reservationQueue: Song[];                                    // 현재 예약된 곡 목록
  addToQueue: (song: Song) => void;                           // 곡을 예약 큐에 추가
  removeFromQueue: (songId: number) => void;                  // 특정 곡을 예약 큐에서 제거
  reorderQueue: (startIndex: number, endIndex: number) => void; // 곡 순서 변경 (드래그 앤 드롭용)
  clearQueue: () => void;                                     // 예약 큐 전체 삭제
}

// Context 생성
export const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

// Provider 컴포넌트의 props 타입
interface ReservationProviderProps {
  children: ReactNode;
}

// 예약 큐 상태를 관리하는 Provider 컴포넌트
export const ReservationProvider: React.FC<ReservationProviderProps> = ({ children }) => {
  // 예약 큐 상태 관리
  const [reservationQueue, setReservationQueue] = useState<Song[]>([]);

  // 곡을 예약 큐에 추가하는 함수
  const addToQueue = (song: Song) => {
    setReservationQueue(prev => {
      // 이미 큐에 있는 곡인지 확인 (중복 방지)
      const isAlreadyInQueue = prev.some(item => item.id === song.id);
      if (isAlreadyInQueue) {
        return prev; // 이미 있으면 추가하지 않음
      }
      return [...prev, song]; // 새 곡을 큐 끝에 추가
    });
  };

  // 특정 곡을 예약 큐에서 제거하는 함수
  const removeFromQueue = (songId: number) => {
    setReservationQueue(prev => prev.filter(song => song.id !== songId));
  };

  // 드래그 앤 드롭으로 곡 순서를 변경하는 함수
  const reorderQueue = (startIndex: number, endIndex: number) => {
    setReservationQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);  // 시작 위치에서 곡 제거
      result.splice(endIndex, 0, removed);             // 끝 위치에 곡 삽입
      return result;
    });
  };

  // 예약 큐 전체를 비우는 함수
  const clearQueue = () => {
    setReservationQueue([]);
  };

  // Context Provider로 자식 컴포넌트들에게 상태와 함수들 제공
  return (
    <ReservationContext.Provider
      value={{
        reservationQueue,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

