import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { Box, Typography, IconButton } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Album {
  id: string;
  title: string;
  coverImage: string;
  artist: string;
  year: string;
  trackCount: number;
}

interface AlbumCoverflowProps {
  albums: Album[];
  onAlbumClick?: (album: Album) => void;
  onPlayClick?: (album: Album) => void;
}

const AlbumCoverflow: React.FC<AlbumCoverflowProps> = ({ 
  albums, 
  onAlbumClick, 
  onPlayClick 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
  };

  const handleAlbumClick = (album: Album) => {
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
        color: '#B3B3B3'
      }}>
        <Typography variant="h6">앨범이 없습니다</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      height: 600, // 앨범 + reflection + 정보를 위한 충분한 높이
      overflow: 'visible',
      background: `
        linear-gradient(135deg, #0A0A0A 0%, #1A0A1A 25%, #2A0A2A 50%, #1A0A1A 75%, #0A0A0A 100%),
        radial-gradient(circle at 20% 20%, rgba(255, 107, 157, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(196, 71, 233, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
      `,
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
          fontWeight: 'bold', 
          color: '#FFFFFF',
          mb: 1,
          textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
        }}>
          My Albums
        </Typography>
        <Typography variant="h6" sx={{ 
          color: '#B3B3B3',
          fontWeight: 400
        }}>
          나만의 음악 컬렉션
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
                      boxShadow: '0 15px 40px rgba(196, 71, 233, 0.4)',
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
                      backgroundImage: `url(${album.coverImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      borderRadius: 2,
                    }}
                  />
                </Box>
                
                {/* Reflection - 앨범 바로 아래에 */}
                <Box
                  className="reflection"
                  sx={{
                    width: '180px',
                    height: '180px',
                    marginTop: 0, // 앨범 바로 아래 붙여서
                    borderRadius: 2,
                    overflow: 'hidden',
                    // 앨범 커버의 실제 이미지를 배경으로 설정
                    backgroundImage: `url(${album.coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    // 자연스러운 반사 효과
                    opacity: index === activeIndex ? 0.6 : 0.3,
                    filter: 'blur(0.3px) brightness(0.7)',
                    transform: 'scaleY(-1)', // 상하반전
                    // 그라디언트로 자연스러운 페이드 효과
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)',
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(196, 71, 233, 0.3)',
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(196, 71, 233, 0.3)',
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
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            opacity: 1,
            '&.swiper-pagination-bullet-active': {
              backgroundColor: '#C147E9',
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
          color: '#FFFFFF'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {albums[activeIndex].title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
            {albums[activeIndex].artist} • {albums[activeIndex].year}
          </Typography>
          <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
            {albums[activeIndex].trackCount}곡
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AlbumCoverflow;