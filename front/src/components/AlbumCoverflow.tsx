import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { Box, Typography, IconButton } from '@mui/material';
import { NavigateBefore, NavigateNext, Lock } from '@mui/icons-material';
import { theme, textStyles } from '../styles/theme';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// 네온 효과를 위한 CSS 애니메이션
const neonStyles = `
  @keyframes neonGlow {
    0%, 100% { 
      text-shadow: 
        0 0 5px #ec4899,
        0 0 10px #ec4899,
        0 0 15px #ec4899,
        0 0 20px #ec4899,
        0 0 25px #ec4899,
        0 0 30px #ec4899;
    }
    50% { 
      text-shadow: 
        0 0 2px #ec4899,
        0 0 5px #ec4899,
        0 0 8px #ec4899,
        0 0 12px #ec4899,
        0 0 15px #ec4899,
        0 0 18px #ec4899;
    }
  }
`;

// AlbumCoverflow 전용 앨범 인터페이스 (UI 표시용)
interface CoverflowAlbum {
  id: string;
  title: string;
  coverImageUrl: string;
  artist: string;
  year: string;
  trackCount: number;
  isPublic?: boolean;
}

interface AlbumCoverflowProps {
  albums: CoverflowAlbum[];
  onAlbumClick?: (album: CoverflowAlbum) => void;
  onPlayClick?: (album: CoverflowAlbum) => void;
  title?: string;
}

const AlbumCoverflow: React.FC<AlbumCoverflowProps> = ({
  albums,
  onAlbumClick,
  title = "My Albums"
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any


  const handleSlideChange = (swiper: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setActiveIndex(swiper.activeIndex);
  };

  const handleAlbumClick = (album: CoverflowAlbum) => {
    if (onAlbumClick) {
      onAlbumClick(album);
    }
  };

  if (albums.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        color: theme.colors.text.tertiary
      }}>
        <Typography variant="h6">앨범이 없습니다</Typography>
      </Box>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: neonStyles }} />
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        height: 600, // 앨범 + reflection + 정보를 위한 충분한 높이
        overflow: 'visible',
        background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, rgba(255, 255, 255, 0.8) 100%)', // 중앙 파란색, 외곽 흰색 그라데이션
        borderRadius: 3,
      }}>
      {/* 제목 */}
      <Box sx={{ 
        position: 'absolute', 
        top: 20, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <Typography variant="h3" sx={{ 
          mb: 1,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '2.5rem',
          textShadow: '0 0 5px #ec4899, 0 0 10px #ec4899, 0 0 15px #ec4899, 0 0 20px #ec4899',
          animation: 'neonGlow 4s ease-in-out infinite',
          letterSpacing: '0.1em',
          // textStyles.title의 그라데이션 효과 오버라이드
          background: 'none',
          backgroundClip: 'unset',
          WebkitBackgroundClip: 'unset',
          WebkitTextFillColor: 'unset',
        }}>
          {title}
        </Typography>
      </Box>

      {/* Swiper Container - 앨범과 reflection을 모두 포함 */}
      <Box sx={{ 
        position: 'absolute',
        top: '55%', 
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: 400, // 앨범 + reflection을 위한 충분한 높이
        zIndex: 5
      }}>
        <Swiper
          ref={swiperRef}
          effect="coverflow"
          grabCursor={false}
          centeredSlides={true}
          slidesPerView={3}
          spaceBetween={50}
          coverflowEffect={{
            rotate: 30,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            el: '.swiper-pagination-custom',
            clickable: true,
            dynamicBullets: true,
          }}
          modules={[EffectCoverflow, Navigation, Pagination]}
          onSlideChange={handleSlideChange}
          className="album-coverflow-swiper"
        >
          {albums.map((album, index) => (
            <SwiperSlide 
              key={album.id} 
              className="album-slide"
              style={{ 
                width: '200px',
                height: '400px', // 앨범 + reflection을 위한 높이
                cursor: 'pointer'
              }}
            >
              {/* 앨범과 Reflection을 포함하는 컨테이너 */}
              <Box sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}>
                {/* 앨범 커버 */}
                <Box
                  className="album-cover"
                  sx={{
                    width: '180px',
                    height: '180px',
                    cursor: 'pointer',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: theme.shadows.glowHover,
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAlbumClick(album);
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: album.coverImageUrl && album.coverImageUrl !== '/image/albumCoverImage.png'
                        ? `url(${album.coverImageUrl})`
                        : 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      '&::after': album.coverImageUrl && album.coverImageUrl !== '/image/albumCoverImage.png' ? {} : {
                        content: '"♪"',
                        position: 'absolute',
                        fontSize: '4rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 'bold',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  />
                </Box>
                
                {/* Reflection - 앨범과 간격을 두고 자연스러운 효과 */}
                <Box
                  className="reflection"
                  sx={{
                    width: '240px', // 더 넓게 시작
                    height: '140px',
                    marginTop: 0, // 앨범과 붙게
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    // 앨범 커버의 실제 이미지를 배경으로 설정
                    backgroundImage: album.coverImageUrl
                      ? `url(${album.coverImageUrl})`
                      : 'linear-gradient(135deg, rgba(196, 71, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    // 더 자연스러운 반사 효과
                    opacity: index === activeIndex ? 0.4 : 0.2,
                    filter: 'blur(1px) brightness(0.5) contrast(0.8)',
                    transform: 'scaleY(-1)', // 상하반전
                    // 더 부드러운 페이드 아웃 효과
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.95) 100%)',
                      borderRadius: 2,
                    },
                    // 물결 흐름 효과
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `
                        radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 40%),
                        radial-gradient(ellipse at 75% 35%, rgba(255,255,255,0.08) 0%, transparent 35%),
                        radial-gradient(ellipse at 50% 70%, rgba(0,0,0,0.15) 0%, transparent 50%)
                      `,
                      borderRadius: 2,
                    }
                  }} 
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>

      {/* Navigation Buttons */}
      <IconButton
        className="swiper-button-prev-custom"
        sx={{
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: theme.colors.navigation.background,
          color: theme.colors.text.primary,
          '&:hover': {
            backgroundColor: theme.colors.navigation.backgroundHover,
          }
        }}
      >
        <NavigateBefore />
      </IconButton>

      <IconButton
        className="swiper-button-next-custom"
        sx={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: theme.colors.navigation.background,
          color: theme.colors.text.primary,
          '&:hover': {
            backgroundColor: theme.colors.navigation.backgroundHover,
          }
        }}
      >
        <NavigateNext />
      </IconButton>

      {/* Pagination */}
      <Box
        className="swiper-pagination-custom"
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          '& .swiper-pagination-bullet': {
            backgroundColor: theme.colors.pagination.inactive,
            opacity: 1,
            '&.swiper-pagination-bullet-active': {
              backgroundColor: theme.colors.pagination.active,
            }
          }
        }}
      />

      {/* 앨범 정보 표시 - reflection 아래에 배치 */}
      {albums[activeIndex] && (
        <Box sx={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 10,
          color: theme.colors.text.primary
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            {!albums[activeIndex].isPublic && (
              <Lock 
                sx={{ 
                  fontSize: 16, 
                  color: '#f97316',
                  filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.8))'
                }} 
              />
            )}
            <Typography variant="h6" sx={{ ...textStyles.subtitle }}>
              {albums[activeIndex].title}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ ...textStyles.caption }}>
            {albums[activeIndex].artist} • {albums[activeIndex].year}
          </Typography>
          <Typography variant="body2" sx={{ ...textStyles.caption }}>
            {albums[activeIndex].trackCount}곡
          </Typography>
        </Box>
      )}
    </Box>
    </>
  );
};

export default AlbumCoverflow;