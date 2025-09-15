/**
 * 곡 검색 패널 컴포넌트 - 순수 HTML/CSS
 * - 실시간 곡 검색 기능 (곡명, 아티스트, 장르로 검색)
 * - 자동 추천 기능 (타이핑하는 즉시 검색 결과 표시)
 * - 검색된 곡을 예약 큐에 추가하는 기능
 * - 중복 예약 방지 및 사용자 알림
 * - 검색 결과에 따른 동적 높이 조정
 * - 나중에 백엔드 API와 연동하여 실제 곡 데이터를 가져올 예정
 */

import React, { useState, useEffect } from 'react';
import { useReservation } from '../../hooks/useReservation';
import type { Song } from '../../types/song';

// 임시 더미 데이터 (나중에 백엔드 API로 대체 예정)
const dummySongs = [
  { id: 1, title: 'Dynamite', artist: 'BTS', genre: 'K-Pop', duration: '3:19' },
  { id: 2, title: 'Butter', artist: 'BTS', genre: 'K-Pop', duration: '2:42' },
  { id: 3, title: 'Permission to Dance', artist: 'BTS', genre: 'K-Pop', duration: '3:07' },
  { id: 4, title: 'Spring Day', artist: 'BTS', genre: 'K-Pop', duration: '4:34' },
  { id: 5, title: 'Boy With Luv', artist: 'BTS', genre: 'K-Pop', duration: '3:49' },
  { id: 6, title: 'How You Like That', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:00' },
  { id: 7, title: 'Lovesick Girls', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:12' },
  { id: 8, title: 'Kill This Love', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:11' },
  { id: 9, title: 'DDU-DU DDU-DU', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:29' },
  { id: 10, title: 'Love Scenario', artist: 'iKON', genre: 'K-Pop', duration: '3:29' },
  { id: 11, title: 'Good Boy', artist: 'GD X TAEYANG', genre: 'K-Pop', duration: '3:29' },
  { id: 12, title: 'Fantastic Baby', artist: 'BIGBANG', genre: 'K-Pop', duration: '3:50' },
  { id: 13, title: 'Bang Bang Bang', artist: 'BIGBANG', genre: 'K-Pop', duration: '3:40' },
  { id: 14, title: 'Gangnam Style', artist: 'PSY', genre: 'K-Pop', duration: '3:39' },
  { id: 15, title: 'Gentleman', artist: 'PSY', genre: 'K-Pop', duration: '3:14' },
  { id: 16, title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', duration: '3:53' },
  { id: 17, title: 'Perfect', artist: 'Ed Sheeran', genre: 'Pop', duration: '4:23' },
  { id: 18, title: 'Thinking Out Loud', artist: 'Ed Sheeran', genre: 'Pop', duration: '4:41' },
  { id: 19, title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', duration: '3:20' },
  { id: 20, title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', duration: '3:23' }
];

const SongSearchPanel: React.FC = () => {
  // 검색 관련 상태 관리
  const [searchTerm, setSearchTerm] = useState('');                    // 검색어
  const [searchResults, setSearchResults] = useState<Song[]>([]);      // 검색 결과 목록
  const [showResults, setShowResults] = useState(false);              // 검색 결과 표시 여부
  
  // 알림 관련 상태 관리
  const [showNotification, setShowNotification] = useState(false);    // 알림 표시 여부
  const [notificationMessage, setNotificationMessage] = useState(''); // 알림 메시지
  const [notificationType, setNotificationType] = useState<'success' | 'info'>('success'); // 알림 타입
  
  // 예약 큐 관련 함수들 가져오기
  const { addToQueue, reservationQueue } = useReservation();

  // 검색어 변경 시 자동 추천 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // 곡명, 아티스트, 장르에서 검색어 포함 여부 확인 (대소문자 무시)
    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered.slice(0, 8)); // 최대 8개 결과만 표시
    setShowResults(true);
  }, [searchTerm]);

  // 곡 선택 시 예약 큐에 추가하는 함수
  const handleSongSelect = (song: Song) => {
    // 이미 큐에 있는 곡인지 확인 (중복 방지)
    const isAlreadyInQueue = reservationQueue.some(item => item.id === song.id);
    
    if (isAlreadyInQueue) {
      // 이미 예약된 곡인 경우 정보 알림
      setNotificationMessage(`${song.title}은(는) 이미 예약 큐에 있습니다.`);
      setNotificationType('info');
    } else {
      // 새로 예약하는 경우 성공 알림
      addToQueue(song);
      setNotificationMessage(`${song.title}이(가) 예약 큐에 추가되었습니다.`);
      setNotificationType('success');
    }
    
    setShowNotification(true);   // 알림 표시
    setSearchTerm('');           // 검색어 초기화
    setShowResults(false);       // 검색 결과 숨기기
    
    // 3초 후 알림 자동 숨기기
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Enter 키 또는 검색 버튼 클릭 시 검색 실행
  const handleSearchSubmit = () => {
    if (searchTerm.trim() === '') return;
    
    // 전체 검색 결과 필터링
    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered);
    setShowResults(true);
  };

  // 검색 결과에 따른 동적 높이 계산
  const getDropdownHeight = () => {
    if (!showResults || searchResults.length === 0) return '0px';
    
    const itemHeight = 80; // 각 검색 결과 아이템의 높이
    const maxHeight = 400; // 최대 높이
    const calculatedHeight = Math.min(searchResults.length * itemHeight, maxHeight);
    
    return `${calculatedHeight}px`;
  };

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '450px',
      transition: 'min-height 0.3s ease',
      overflow: 'visible'
    }}>
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
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
          }}>
            <span style={{ fontSize: '20px', color: '#000' }}>🎵</span>
          </div>
          <div>
            <h6 style={{ 
              color: '#00ffff',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              margin: 0,
              fontSize: '1.25rem'
            }}>
              NEURAL SEARCH
            </h6>
            <p style={{ 
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: 0,
              fontSize: '0.75rem'
            }}>
              MUSIC DATABASE
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(0, 255, 0, 0.2)',
            color: '#00ff00',
            border: '1px solid #00ff00',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem'
          }}>
            LIVE
          </span>
        </div>
      </div>
      
      {/* 검색 입력 필드 */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="곡명, 아티스트, 장르로 검색하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            style={{
              width: '100%',
              padding: '12px 16px 12px 45px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#00ffff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid #00ffff';
              e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(0, 255, 255, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
          
          {/* 검색 아이콘 */}
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#00ffff',
            fontSize: '20px'
          }}>
            🔍
          </span>
          
          {/* 검색 버튼 */}
          {searchTerm && (
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
                borderRadius: '4px',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              🔍
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 드롭다운 */}
      {showResults && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 8px)', 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          height: getDropdownHeight(),
          overflow: 'auto',
          background: 'rgba(26, 26, 26, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          transition: 'height 0.3s ease'
        }}>
          {searchResults.length > 0 ? (
            <div>
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                    e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.3)';
                    e.currentTarget.style.borderRadius = '8px';
                    e.currentTarget.style.margin = '4px';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderRadius = '0';
                    e.currentTarget.style.margin = '0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
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
                        background: 'rgba(255, 0, 128, 0.2)',
                        color: '#ff0080',
                        border: '1px solid #ff0080',
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
                  
                  {/* 추가 버튼 */}
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00ffff',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '20px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    ➕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // 검색 결과가 없을 때
            <div style={{ 
              padding: '24px', 
              textAlign: 'center',
              color: '#888'
            }}>
              <p style={{ margin: 0 }}>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 검색 사용법 힌트 */}
      <p style={{ 
        marginTop: '8px',
        color: '#888',
        fontSize: '0.75rem',
        margin: '8px 0 0 0'
      }}>
        💡 팁: "BTS", "K-Pop", "Dynamite" 등으로 검색해보세요
      </p>

      {/* 예약 결과 알림 */}
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
          fontWeight: 600,
          animation: 'slideUp 0.3s ease'
        }}>
          {notificationMessage}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SongSearchPanel;