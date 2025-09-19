/**
 * 예약 큐 상태 관리를 위한 Context
 * - 곡 예약, 제거, 순서 변경, 전체 삭제 기능 제공
 * - 현재 재생 중인 곡 상태 관리
 * - 전역 상태로 예약 큐 데이터를 관리
 * - 나중에 Redis 연동 시 이 Context의 로직을 API 호출로 대체 예정
 */

import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Song } from '../types/song';

// Context에서 제공할 함수들의 타입 정의
interface ReservationContextType {
  reservationQueue: Song[];                                    // 현재 예약된 곡 목록
  selectedSong: Song | null;                                  // 현재 선택된 곡 (MR카드에 표시)
  currentPlayingSong: Song | null;                            // 현재 재생 중인 곡
  isPlaying: boolean;                                          // 재생 상태
  addToQueue: (song: Song) => void;                           // 곡을 예약 큐에 추가
  removeFromQueue: (songId: number) => void;                  // 특정 곡을 예약 큐에서 제거
  reorderQueue: (startIndex: number, endIndex: number) => void; // 곡 순서 변경 (드래그 앤 드롭용)
  clearQueue: () => void;                                     // 예약 큐 전체 삭제
  selectSong: (song: Song) => void;                           // 곡 선택 (MR카드에 표시)
  playSong: () => void;                                       // 선택된 곡 재생 시작
  pauseSong: () => void;                                      // 곡 일시정지
  stopSong: () => void;                                       // 곡 재생 정지
  onSongFinished: () => void;                                 // 곡이 끝났을 때 호출
}

// Context 생성
export const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

// Provider 컴포넌트의 props 타입
interface ReservationProviderProps {
  children: ReactNode;
}

// localStorage 키
const RESERVATION_QUEUE_KEY = 'reservation-queue';

// localStorage에서 예약 큐 로드
const loadReservationQueue = (): Song[] => {
  try {
    const saved = localStorage.getItem(RESERVATION_QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('예약 큐 로드 실패:', error);
    return [];
  }
};

// localStorage에 예약 큐 저장
const saveReservationQueue = (queue: Song[]) => {
  try {
    localStorage.setItem(RESERVATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('예약 큐 저장 실패:', error);
  }
};

// 예약 큐 상태를 관리하는 Provider 컴포넌트
export const ReservationProvider: React.FC<ReservationProviderProps> = ({ children }) => {
  // 예약 큐 상태 관리 - localStorage에서 초기값 로드
  const [reservationQueue, setReservationQueue] = useState<Song[]>(() => loadReservationQueue());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 예약 큐가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveReservationQueue(reservationQueue);
  }, [reservationQueue]);

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
    
    // 만약 삭제된 곡이 현재 재생 중인 곡이라면 재생 정지
    if (currentPlayingSong && currentPlayingSong.id === songId) {
      setCurrentPlayingSong(null);
      setIsPlaying(false);
    }
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
    setCurrentPlayingSong(null);
    setIsPlaying(false);
  };

  // 노래 상세 정보를 가져오는 API 함수
  const fetchSongDetails = async (songId: number): Promise<Song | null> => {
    try {
      const authToken = localStorage.getItem('auth-token');
      const response = await fetch(`http://https://j13c103.p.ssafy.io/api/songs/${songId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const songData = await response.json();
      console.log('📡 API 응답 원본 데이터:', songData);
      console.log('📡 API 응답 가사 필드:', songData.lyrics);
      console.log('📡 API 응답 가사 타입:', typeof songData.lyrics);
      console.log('📡 API 응답 가사 길이:', songData.lyrics?.length || 0);
      
      // YouTube ID 추출 함수
      const extractYouTubeId = (url: string): string | undefined => {
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            return urlObj.searchParams.get('v') || undefined;
          } else if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1) || undefined;
          }
        } catch {
          return undefined;
        }
        return undefined;
      };

      // 재생시간 포맷팅 함수
      const formatDuration = (durationMs: number | null): string => {
        if (!durationMs) return '0:00';
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
      
      // API 응답을 Song 타입으로 변환
      const detailedSong: Song = {
        id: songData.songId,
        title: songData.songName,
        artist: songData.artistName,
        albumName: songData.albumName,
        duration: formatDuration(songData.durationMs),
        albumCoverUrl: songData.albumCoverUrl,
        youtubeId: extractYouTubeId(songData.musicUrl),
        lyrics: songData.lyrics
      };

      return detailedSong;
    } catch (error) {
      console.error('노래 상세 정보 가져오기 실패:', error);
      return null;
    }
  };

  // 곡 선택 함수 - 새로고침 효과로 완전 초기화
  const selectSong = async (song: Song) => {
    console.log('🔄 노래 클릭 - 새로고침 효과 시작');
    console.log('📋 선택할 노래:', song.title, 'ID:', song.id);
    
    // 완전 초기화 (새로고침 효과)
    console.log('🔄 모든 상태 초기화 중...');
    setIsPlaying(false);
    setCurrentPlayingSong(null);
    setSelectedSong(null); // 먼저 null로 설정하여 완전 초기화
    
    // 약간의 지연 후 새 노래 설정 (새로고침 효과)
    setTimeout(async () => {
      try {
        console.log('📡 새 노래 상세 정보 로드:', song.title);
        const detailedSong = await fetchSongDetails(song.id);
        
        if (detailedSong) {
          console.log('✅ 새로고침 후 노래 설정 완료');
          console.log('📝 가사 존재:', !!detailedSong.lyrics);
          setSelectedSong(detailedSong);
        } else {
          console.log('⚠️ API 실패 - 기본 정보로 설정');
          setSelectedSong(song);
        }
      } catch (error) {
        console.error('❌ 새로고침 후 로드 오류:', error);
        setSelectedSong(song);
      }
    }, 200); // 0.2초 지연으로 새로고침 효과
  };

  // 재생 버튼 클릭 함수 - 단순 토글
  const playSong = () => {
    if (!selectedSong) {
      console.log('❌ 선택된 노래가 없습니다');
      return;
    }
    
    console.log('🎮 재생 버튼 클릭:', {
      selectedSong: selectedSong.title,
      currentPlayingSong: currentPlayingSong?.title,
      isPlaying
    });
    
    if (isPlaying) {
      // 재생 중 → 완전 초기화 (새로고침 효과)
      console.log('⏹️ 재생 정지 - 새로고침 효과 (모든 상태 초기화)');
      setIsPlaying(false);
      setCurrentPlayingSong(null);
      setSelectedSong(null); // 선택된 노래도 해제
    } else {
      // 정지 중 → 재생
      console.log('▶️ 재생 시작:', selectedSong.title);
      setCurrentPlayingSong(selectedSong);
      setIsPlaying(true);
    }
  };

  // 곡 일시정지 함수 (현재 곡 유지)
  const pauseSong = () => {
    console.log('⏸️ 일시정지');
    setIsPlaying(false);
  };

  // 곡 완전 정지 함수 (곡 해제)
  const stopSong = () => {
    console.log('⏹️ 완전 정지 및 초기화');
    setIsPlaying(false);
    setCurrentPlayingSong(null);
  };

  // 곡이 끝났을 때 호출
  // 노래 종료 처리 함수 - 단순화
  const onSongFinished = () => {
    console.log('🏁 노래 종료 - 재생 정지');
    setIsPlaying(false);
    setCurrentPlayingSong(null);
    
    // 자동으로 다음 곡을 선택하지 않음 (사용자가 수동으로 다음곡 버튼 클릭)
    console.log('💡 다음곡을 재생하려면 "다음곡" 버튼을 클릭해주세요');
  };

  // Context Provider로 자식 컴포넌트들에게 상태와 함수들 제공
  return (
    <ReservationContext.Provider
      value={{
        reservationQueue,
        selectedSong,
        currentPlayingSong,
        isPlaying,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        selectSong,
        playSong,
        pauseSong,
        stopSong,
        onSongFinished,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};