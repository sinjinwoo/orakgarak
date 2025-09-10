/**
 * 예약 큐 관련 커스텀 훅
 * - ReservationContext를 사용하기 위한 훅
 * - Fast refresh 문제 해결을 위해 별도 파일로 분리
 */

import { useContext } from 'react';
import { ReservationContext } from '../contexts/ReservationContext';

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
