/**
 * SongSearchPanel - 완전 순수 HTML/CSS 곡 검색 패널
 * MUI Box 자동 생성 CSS 완전 제거 버전
 */

import React, { useState, useEffect } from 'react';
import { useReservation } from '../../hooks/useReservation';
import type { Song } from '../../types/song';

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
  { id: 20, title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', duration: '3:23' },
  // 추가 더미: 브라운아이드소울 - gone (유튜브 MR 사용)
  { id: 21, title: 'gone', artist: '브라운아이드소울', genre: 'K-Pop', duration: '4:11', youtubeId: 'yNdQjHnyy_c' },
  // 추가 더미: 이승환 - 다만 (유튜브 MR 사용)
  { id: 27015, title: '다만', artist: '이승환', genre: 'Ballad', duration: '3:35', youtubeId: 'NHwn7cGbciU' },
  // 추가 더미: 이선희 - 끝사랑 (유튜브 MR 사용)
  { id: 27071, title: '끝사랑', artist: '이선희', genre: 'Ballad', duration: '4:10', youtubeId: 'UZy29hJkWfY' },
  // 추가 한국 가요들
  { id: 22, title: '사랑해요', artist: '김태우', genre: 'Ballad', duration: '4:15' },
  { id: 23, title: '겨울비', artist: '박효신', genre: 'Ballad', duration: '4:32' },
  { id: 24, title: '벚꽃엔딩', artist: '버스커 버스커', genre: 'Indie', duration: '4:20' },
  { id: 25, title: '너를 만나', artist: '김범수', genre: 'Ballad', duration: '4:05' },
  { id: 26, title: '사랑이란', artist: '김동률', genre: 'Ballad', duration: '4:18' },
  { id: 27, title: '내가 사랑한 사람', artist: '김건모', genre: 'Ballad', duration: '4:30' },
  { id: 28, title: '너의 모든 순간', artist: '성시경', genre: 'Ballad', duration: '4:25' },
  { id: 29, title: '사랑할 때', artist: '이승기', genre: 'Ballad', duration: '4:12' },
  { id: 30, title: '가시', artist: '버즈', genre: 'Rock', duration: '4:05' }
];

const SongSearchPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info'>('success');
  
  const { addToQueue, reservationQueue } = useReservation();

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered.slice(0, 8));
    setShowResults(true);
  }, [searchTerm]);

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

  const handleSearchSubmit = () => {
    if (searchTerm.trim() === '') return;
    
    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered);
    setShowResults(true);
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
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
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🎵
          </div>
          <div>
            <h3 style={{
              color: '#00ffff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}>
              NEURAL SEARCH
            </h3>
            <p style={{
              color: '#888',
              fontSize: '0.8rem',
              margin: '0',
              textTransform: 'uppercase'
            }}>
              MUSIC DATABASE
            </p>
          </div>
        </div>

        <span style={{
          background: 'rgba(0, 255, 0, 0.2)',
          color: '#00ff00',
          border: '1px solid #00ff00',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '0.7rem',
          fontWeight: 'bold'
        }}>
          LIVE
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
          placeholder="곡명, 아티스트, 장르로 검색하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            color: '#00ffff',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.border = '1px solid #00ffff';
            e.target.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid rgba(0, 255, 255, 0.3)';
            e.target.style.boxShadow = 'none';
          }}
        />
        
        <span style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#00ffff',
          fontSize: '16px'
        }}>
          🔍
        </span>
        
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
              fontSize: '14px'
            }}
          >
            🔍
          </button>
        )}
      </div>

      {/* 검색 결과 영역 - 컴포넌트 내부에서 스크롤 */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {showResults ? (
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            {searchResults.length > 0 ? (
              <div>
                {searchResults.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => handleSongSelect(song)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
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
                          background: 'rgba(255, 0, 128, 0.2)',
                          color: '#ff0080',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.7rem'
                        }}>
                          {song.genre}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.7rem' }}>
                          {song.duration}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00ffff',
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
                padding: '20px', 
                textAlign: 'center', 
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <p style={{ margin: '0' }}>검색 결과가 없습니다.</p>
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
            <div style={{ fontSize: '2rem', opacity: 0.5 }}>🔍</div>
            <p style={{
              fontSize: '0.9rem',
              margin: '0',
              color: '#666'
            }}>
              곡명, 아티스트, 장르로 검색하세요
            </p>
            <p style={{
              fontSize: '0.75rem',
              margin: '0',
              color: '#888'
            }}>
              💡 팁: "BTS", "K-Pop", "Dynamite" 등으로 검색해보세요
            </p>
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