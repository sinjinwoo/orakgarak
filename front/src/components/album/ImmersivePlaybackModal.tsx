import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAudio } from '../../hooks/useAudio';

// 앨범 트랙 카드 타입 정의
interface AlbumTrackCard {
  id: string;
  title: string;
  artist: string;
  description: string;
  coverImageUrl: string;
  audioUrl?: string;
  duration: string;
  score: number;
  likeCount: number;
  playCount: number;
  trackNumber: number;
}

interface ImmersivePlaybackModalProps {
  open: boolean;
  onClose: () => void;
  albumData: {
    id: string;
    title: string;
    tracks: Array<{
      id: string;
      title: string;
      audioUrl?: string;
      duration?: string;
    }>;
    coverImageUrl: string;
    description: string;
  };
}

const ImmersivePlaybackModal: React.FC<ImmersivePlaybackModalProps> = ({
  open,
  onClose,
  albumData,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [theta, setTheta] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [currentPlayingCardIndex, setCurrentPlayingCardIndex] = useState<number | null>(null);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const radius = 400;
  const totalCards = albumData.tracks.length; // 앨범 트랙 수에 따라 동적 설정

  // 앨범 트랙 카드 데이터 생성 (메모이제이션으로 최적화)
  const cards = useMemo((): AlbumTrackCard[] => {
    return albumData.tracks.map((track, index) => ({
      id: track.id,
      title: track.title,
      artist: 'Unknown Artist',
      description: `${track.title}의 감성적인 보컬 커버입니다. 내 목소리로 재해석한 이 곡은 특별한 의미를 담고 있습니다.`,
      coverImageUrl: albumData.coverImageUrlUrl,
      audioUrl: track.audioUrl,
      duration: track.duration || '0:00',
      score: Math.floor(Math.random() * 20) + 80, // 80-100점 랜덤
      likeCount: Math.floor(Math.random() * 50) + 10, // 10-60 좋아요
      playCount: Math.floor(Math.random() * 200) + 50, // 50-250 재생
      trackNumber: index + 1,
    }));
  }, [albumData.tracks, albumData.coverImageUrl]);

  // 오디오 훅 사용
  const [audioState, audioControls] = useAudio({
    onEnded: () => {
      setCurrentPlayingCardIndex(null);
      // 다음 카드로 자동 이동
      nextCard();
    },
  });

  // 카드 배치 함수
  const arrangeCards = useCallback(() => {
    if (!carouselRef.current) return;
    
    const carousel = carouselRef.current;
    const cardElements = carousel.querySelectorAll('.memory-card');
    const angle = 360 / totalCards;
    
    cardElements.forEach((card, index) => {
      const cardElement = card as HTMLElement;
      const cardAngle = angle * index;
      // const rad = (cardAngle * Math.PI) / 180;
      
      cardElement.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px)`;
      cardElement.setAttribute('data-index', index.toString());
    });
  }, [radius, totalCards]);

  // 캐러셀 회전
  const rotateCarousel = useCallback(() => {
    if (!carouselRef.current) return;
    carouselRef.current.style.transform = `rotateY(${theta}deg)`;
    
    const newIndex = Math.round(Math.abs(theta / (360 / totalCards)) % totalCards);
    setCurrentIndex(newIndex >= totalCards ? 0 : newIndex);
  }, [theta, totalCards]);

  // 다음 카드
  const nextCard = useCallback(() => {
    setTheta(prev => prev - 360 / totalCards);
  }, [totalCards]);

  // 이전 카드
  const prevCard = useCallback(() => {
    setTheta(prev => prev + 360 / totalCards);
  }, [totalCards]);

  // 카드 뒤집기
  const flipCard = useCallback((cardIndex: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 터치 이벤트인 경우 스크롤 방지
    if ('touches' in e) {
      document.body.style.overflow = 'hidden';
    }
    
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  }, []);

  // 드래그 중
  const handleDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diffX = clientX - startX;
    
    // 모바일에서 더 민감하게 반응하도록 조정
    const sensitivity = 'touches' in e ? 0.8 : 0.5;
    const newTheta = theta + diffX * sensitivity;
    
    if (carouselRef.current) {
      carouselRef.current.style.transform = `rotateY(${newTheta}deg)`;
    }
  }, [isDragging, startX, theta]);

  // 드래그 종료
  const handleDragEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 터치 이벤트인 경우 스크롤 복원
    if ('changedTouches' in e) {
      document.body.style.overflow = '';
    }
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diffX = clientX - startX;
    
    // 드래그 거리가 충분한 경우 카드 이동 (모바일에서는 더 작은 거리로 조정)
    const threshold = 'changedTouches' in e ? 30 : 50;
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        prevCard();
      } else {
        nextCard();
      }
    } else {
      // 드래그 거리가 부족한 경우 가장 가까운 카드로 스냅
      const anglePerCard = 360 / totalCards;
      const currentAngle = theta % 360;
      const normalizedAngle = currentAngle < 0 ? currentAngle + 360 : currentAngle;
      const closestCardIndex = Math.round(normalizedAngle / anglePerCard);
      const snapAngle = closestCardIndex * anglePerCard;
      
      // 부드러운 애니메이션으로 스냅
      setTheta(snapAngle);
      
      // 현재 인덱스 업데이트
      const newIndex = closestCardIndex % totalCards;
      setCurrentIndex(newIndex >= 0 ? newIndex : newIndex + totalCards);
    }
  }, [isDragging, startX, theta, totalCards, prevCard, nextCard]);

  // 오디오 재생
  const playAudio = useCallback((audioUrl?: string, cardIndex?: number) => {
    if (audioUrl && audioUrl.trim() !== '') {
      try {
        audioControls.load(audioUrl);
        audioControls.play();
        if (cardIndex !== undefined) {
          setCurrentPlayingCardIndex(cardIndex);
        }
      } catch (error) {
        console.error('오디오 재생 중 오류가 발생했습니다:', error);
      }
    } else {
      console.warn('유효하지 않은 오디오 URL입니다:', audioUrl);
    }
  }, [audioControls]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        nextCard();
        break;
      case 'ArrowRight':
        prevCard();
        break;
      case ' ':
        e.preventDefault(); // 스크롤 방지
        if (audioState.isPlaying) {
          audioControls.pause();
        } else {
          const currentCard = cards[currentIndex];
          if (currentCard?.audioUrl) {
            playAudio(currentCard.audioUrl, currentIndex);
          }
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [open, nextCard, prevCard, currentIndex, onClose, audioState.isPlaying, audioControls, cards, playAudio]);

  // 초기화
  useEffect(() => {
    if (open) {
      arrangeCards();
      rotateCarousel();
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // 스크롤 복원
    };
  }, [open, arrangeCards, rotateCarousel, handleKeyDown]);

  // theta 변경 시 캐러셀 회전
  useEffect(() => {
    rotateCarousel();
  }, [theta, rotateCarousel]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          borderRadius: 0,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
      }}
    >
      {/* 우주 배경 */}
      <div className="cosmos-background">
        <div className="stars-container"></div>
      </div>

      <DialogTitle sx={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        zIndex: 1000,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ 
          background: 'linear-gradient(90deg, #9d00ff, #00e5ff)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 700,
          letterSpacing: '1px'
        }}>
          {albumData.title} - 몰입 재생
        </Typography>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(20, 20, 40, 0.7)',
            border: '1px solid #9d00ff',
            '&:hover': {
              backgroundColor: 'rgba(30, 30, 60, 0.9)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        padding: 0, 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* 캐러셀 컨테이너 */}
        <div 
          className="carousel-container"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDrag}
          onTouchMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          <div 
            ref={carouselRef}
            className="carousel"
            style={{ transform: `rotateY(${theta}deg)` }}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`memory-card ${flippedCards.has(index) ? 'flipped' : ''}`}
                data-index={index}
                onClick={() => flipCard(index)}
              >
                <div className="card-inner">
                  {/* 카드 앞면 */}
                  <div className="card-front">
                    <div className="card-content">
                      <div className="memory-date">TRACK {card.trackNumber}</div>
                      <h3>{card.title}</h3>
                      <div className="memory-image">
                        <img 
                          src={card.coverImageUrl} 
                          alt={card.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                        <div className="glitch-effect"></div>
                        {/* 재생 상태 표시 */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: currentPlayingCardIndex === index && audioState.isPlaying 
                            ? 'rgba(157, 0, 255, 0.8)' 
                            : 'rgba(0, 0, 0, 0.7)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          transition: 'background 0.3s ease'
                        }}>
                          <div style={{
                            width: '0',
                            height: '0',
                            borderLeft: '15px solid #ffffff',
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent',
                            marginLeft: '3px'
                          }}></div>
                        </div>
                      </div>
                      {/* 런타임 프로그레스 바 */}
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        border: '1px solid rgba(157, 0, 255, 0.2)'
                      }}>
                        {/* 프로그레스 바 */}
                        <div style={{
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            width: `${currentPlayingCardIndex === index && audioState.isPlaying && audioState.duration > 0 
                              ? (audioState.currentTime / audioState.duration) * 100 
                              : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #9d00ff, #00e5ff)',
                            borderRadius: '2px',
                            transition: 'width 0.1s ease'
                          }}></div>
                        </div>
                        
                        {/* 시간 표시 */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          color: '#b8b8ff'
                        }}>
                          <span>
                            {currentPlayingCardIndex === index && audioState.isPlaying 
                              ? `${Math.floor(audioState.currentTime / 60)}:${(audioState.currentTime % 60).toFixed(0).padStart(2, '0')}`
                              : '0:00'
                            }
                          </span>
                          <span>
                            {card.duration}
                          </span>
                        </div>
                      </div>
                      <div className="card-glow"></div>
                    </div>
                  </div>
                  
                  {/* 카드 뒷면 */}
                  <div className="card-back">
                    <div className="card-content">
                      <h3>{card.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#b8b8ff', marginBottom: '10px' }}>
                        {card.artist}
                      </p>
                      
                      
                      <div className="memory-coordinates">
                        <span>🎵 {card.duration}</span>
                        <span className="time-stamp">⭐ {card.score}점</span>
                        <span>❤️ {card.likeCount} 좋아요</span>
                        <span>▶️ {card.playCount} 재생</span>
                      </div>
                      
                      {/* 프로그레스 바 */}
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        border: '1px solid rgba(157, 0, 255, 0.2)'
                      }}>
                        {/* 프로그레스 바 */}
                        <div style={{
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            width: `${currentPlayingCardIndex === index && audioState.isPlaying && audioState.duration > 0 
                              ? (audioState.currentTime / audioState.duration) * 100 
                              : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #9d00ff, #00e5ff)',
                            borderRadius: '2px',
                            transition: 'width 0.1s ease'
                          }}></div>
                        </div>
                        
                        {/* 시간 표시 */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          color: '#b8b8ff'
                        }}>
                          <span>
                            {currentPlayingCardIndex === index && audioState.isPlaying 
                              ? `${Math.floor(audioState.currentTime / 60)}:${(audioState.currentTime % 60).toFixed(0).padStart(2, '0')}`
                              : '0:00'
                            }
                          </span>
                          <span>
                            {card.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* 하단 안내 */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#b8b8ff',
          fontSize: '0.8rem',
          opacity: 0.7,
          textAlign: 'center'
        }}>
          카드를 클릭하여 곡 정보를 확인하세요 • 화살표 키로 탐색 • 스페이스바로 재생/일시정지
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImmersivePlaybackModal;
