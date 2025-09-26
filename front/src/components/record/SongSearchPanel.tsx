/**
 * SongSearchPanel - 완전 순수 HTML/CSS 곡 검색 패널
 * 실제 API 엔드포인트 연동 버전
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useReservation } from '../../hooks/useReservation';

// API 응답 타입 정의
interface SongApiResponse {
  id: number;
  songId: number;
  songName: string;
  artistName: string;
  albumName: string;
  musicUrl: string;
  lyrics: string;
  albumCoverUrl: string;
  spotifyTrackId: string;
  durationMs: number | null;
  popularity: number | null;
  status: string;
}

// Song 타입 정의 (기존 타입과 호환)
interface Song {
  id: number;
  title: string;
  artist: string;
  albumName: string;
  duration: string;
  albumCoverUrl: string;
  youtubeId?: string;
}

// API 응답을 Song 타입으로 변환하는 함수
const convertApiResponseToSong = (apiSong: SongApiResponse): Song => {
  // YouTube URL에서 video ID 추출
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

  // 재생시간 포맷팅 (밀리초를 mm:ss 형식으로)
  const formatDuration = (durationMs: number | null): string => {
    if (!durationMs) return '0:00';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    id: apiSong.songId, // songId를 number로 사용
    title: apiSong.songName,
    artist: apiSong.artistName,
    albumName: apiSong.albumName,
    duration: formatDuration(apiSong.durationMs),
    albumCoverUrl: apiSong.albumCoverUrl,
    youtubeId: extractYouTubeId(apiSong.musicUrl)
  };
};

// 실시간 검색 API 호출 함수
const searchSongs = async (keyword: string): Promise<Song[]> => {
  if (!keyword.trim() || keyword.trim().length < 2) return [];
  
  try {
    // 백엔드 서버 주소를 명시적으로 지정 (포트 번호를 실제 백엔드 포트로 변경하세요)
    // 예: 8080, 8000, 3001 등 백엔드가 실행되는 포트
    const BACKEND_BASE_URL = 'https://j13c103.p.ssafy.io/api'; // 백엔드 포트에 맞게 수정
    const apiUrl = `${BACKEND_BASE_URL}/songs/search/realtime?keyword=${encodeURIComponent(keyword)}`;
    
    console.log('API 호출:', apiUrl); // 디버깅용 로그
    
    // JWT 토큰 가져오기
    const authToken = localStorage.getItem('auth-token');
    console.log('토큰 상태:', authToken ? '토큰 존재' : '토큰 없음'); // 디버깅용 로그
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // JWT 토큰을 Authorization 헤더에 추가
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    });
    
    console.log('응답 상태:', response.status); // 디버깅용 로그
    console.log('응답 헤더:', response.headers.get('content-type')); // 디버깅용 로그
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Content-Type이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('JSON이 아닌 응답:', responseText.substring(0, 200));
      throw new Error(`Expected JSON but received: ${contentType || 'unknown'}`);
    }
    
    const apiResults: SongApiResponse[] = await response.json();
    console.log('API 응답 결과:', apiResults); // 디버깅용 로그
    
    // 백엔드에서 리스트 형식으로 보낸다고 했으므로 바로 처리
    if (!Array.isArray(apiResults)) {
      console.error('응답이 배열이 아닙니다:', apiResults);
      return [];
    }
    
    return apiResults
      .filter(song => song.status === 'success') // 성공한 결과만 필터링
      .map(convertApiResponseToSong);
  } catch (error) {
    console.error('노래 검색 중 오류 발생:', error);
    
    // 더 자세한 오류 정보 제공
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('네트워크 오류: 백엔드 서버 연결 실패 - CORS 또는 서버 상태를 확인하세요');
    }
    
    return [];
  }
};

const SongSearchPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info'>('success');
  const [isLoading, setIsLoading] = useState(false);
  
  const { addToQueue, reservationQueue } = useReservation();

  // 사이버펑크 스크롤바 스타일
  const cyberScrollbarStyle = `
    .cyber-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .cyber-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }
    .cyber-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(45deg, #00ffff, #ff0080);
      border-radius: 4px;
      border: 1px solid rgba(0, 255, 255, 0.3);
    }
    .cyber-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(45deg, #00cccc, #cc0066);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
  `;

  // 검색 함수
  const performSearch = useCallback(async (keyword: string) => {
    if (keyword.trim() === '' || keyword.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchSongs(keyword);
      setSearchResults(results.slice(0, 8)); // 최대 8개 결과만 표시
      setShowResults(true);
    } catch (error) {
      console.error('검색 중 오류:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 디바운스된 검색 useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  const handleSongSelect = (song: Song) => {
    const isAlreadyInQueue = reservationQueue.some(item => item.id === song.id);
    
    if (isAlreadyInQueue) {
      setNotificationMessage(`${song.title}은(는) 이미 예약 큐에 있습니다.`);
      setNotificationType('info');
    } else {
      addToQueue(song);
      setNotificationMessage(`${song.title}이(가) 예약 큐에 추가되었습니다.`);
      setNotificationType('success');
    }
    
    setShowNotification(true);
    setSearchTerm('');
    setShowResults(false);
    
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleSearchSubmit = async () => {
    if (searchTerm.trim() === '' || searchTerm.trim().length < 2) {
      setNotificationMessage('2글자 이상 입력해주세요.');
      setNotificationType('info');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    
    setIsLoading(true);
    try {
      const results = await searchSongs(searchTerm);
      setSearchResults(results);
    setShowResults(true);
    } catch (error) {
      console.error('검색 중 오류:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 사이버펑크 스크롤바 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: cyberScrollbarStyle }} />
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '35px',
            height: '35px',
            borderRadius: '8px',
            background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🎵
          </div>
          <div>
            <h3 style={{
              color: '#06b6d4',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              textShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              노래 검색
            </h3>
            <p style={{
              color: '#888',
              fontSize: '0.8rem',
              margin: '0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              실시간 검색
            </p>
          </div>
        </div>

        <span style={{
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#06b6d4',
          border: '1px solid rgba(6, 182, 212, 0.6)',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          실시간
        </span>
      </div>
      
      {/* 검색 입력 필드 */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '15px',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="곡명, 아티스트로 검색하세요 (2글자 이상)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: searchTerm.length > 0 && searchTerm.length < 2 
              ? '1px solid rgba(255, 165, 0, 0.6)' 
              : '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            color: '#06b6d4',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          onFocus={(e) => {
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
            e.target.style.border = '1px solid #06b6d4';
            e.target.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.3)';
            }
          }}
          onBlur={(e) => {
            if (searchTerm.length > 0 && searchTerm.length < 2) {
              e.target.style.border = '1px solid rgba(255, 165, 0, 0.6)';
            } else {
            e.target.style.border = '1px solid rgba(6, 182, 212, 0.3)';
            }
            e.target.style.boxShadow = 'none';
          }}
        />
        
        <span style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: searchTerm.length > 0 && searchTerm.length < 2 ? '#ffa500' : '#00ffff',
          fontSize: '16px'
        }}>
          {isLoading ? '⏳' : '🔍'}
        </span>
        
        {searchTerm && searchTerm.length >= 2 && (
          <button
            onClick={handleSearchSubmit}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#00ffff',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}
          >
            🔍
          </button>
        )}
      </div>

      {/* 최소 글자 수 안내 */}
      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '15px',
          color: '#ffa500',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          ⚠️ 검색어를 2글자 이상 입력해주세요
        </div>
      )}

      {/* 검색 결과 영역 - 컴포넌트 내부에서 스크롤 */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {showResults ? (
          <div 
            className="cyber-scrollbar"
            style={{
            flex: 1,
            overflow: 'auto',
            scrollBehavior: 'smooth',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            marginBottom: '10px'
            }}
          >
            {isLoading ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: '#06b6d4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ fontSize: '2rem' }}>⏳</div>
                <p style={{ margin: '0', fontSize: '0.9rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>검색 중...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#06b6d4',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  검색 결과 ({searchResults.length}곡)
                </div>
                {searchResults.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => handleSongSelect(song)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      transition: 'background 0.2s ease',
                      minHeight: '80px' // 최소 높이 보장
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      background: song.albumCoverUrl 
                        ? `url(${song.albumCoverUrl})` 
                        : 'linear-gradient(45deg, #ec4899, #06b6d4)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                      border: '1px solid rgba(0, 255, 255, 0.3)'
                    }}>
                      {!song.albumCoverUrl && '🎵'}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        margin: '0 0 6px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}>
                        {song.title}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        flexWrap: 'wrap',
                        marginBottom: '4px'
                      }}>
                        <span style={{ 
                          color: '#06b6d4', 
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {song.artist}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>•</span>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>
                          {song.duration}
                        </span>
                        {song.youtubeId && (
                          <>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>•</span>
                        <span style={{
                          color: '#ec4899',
                              fontSize: '0.7rem',
                          background: 'rgba(236, 72, 153, 0.15)',
                          padding: '2px 6px',
                              borderRadius: '8px'
                        }}>
                              MR
                        </span>
                          </>
                        )}
                      </div>
                      <div style={{
                        background: 'rgba(236, 72, 153, 0.15)',
                        color: '#ec4899',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        display: 'inline-block',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        boxSizing: 'border-box'
                      }}>
                        {song.albumName}
                      </div>
                    </div>
                    
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#06b6d4',
                        cursor: 'pointer',
                        padding: '6px',
                        fontSize: '16px',
                        flexShrink: 0
                      }}
                    >
                      ➕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '10px',
                height: '100%'
              }}>
                <div style={{ fontSize: '2rem', opacity: 0.5 }}>🚫</div>
                <p style={{ margin: '0', fontSize: '0.9rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  "{searchTerm}"에 대한 검색 결과가 없습니다.
                </p>
                <p style={{ margin: '0', fontSize: '0.8rem', color: '#666', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  다른 검색어를 입력해보세요.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 검색 힌트 - 검색 결과가 없을 때만 표시 */
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px',
            color: '#888',
            textAlign: 'center'
          }}>

            <p style={{
              fontSize: '0.9rem',
              margin: '0',
              color: '#666',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              곡명, 아티스트로 검색하세요
            </p>
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginTop: '10px',
              color: '#06b6d4',
              fontSize: '0.75rem'
            }}>
              ⚡ 2글자 이상 입력하면 자동으로 검색됩니다
            </div>
          </div>
        )}
      </div>

      {/* 알림 */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: notificationType === 'success' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 165, 0, 0.9)',
          color: '#000',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          fontWeight: 'bold'
        }}>
          {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default SongSearchPanel;