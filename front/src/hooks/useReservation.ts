import { useContext } from 'react';
import { ReservationContext } from '../contexts/ReservationContext';

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};