import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  LinearProgress,
  Chip,
  Stack,
  Button
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  SkipPrevious,
  VolumeUp,
  Equalizer,
  MusicNote,
  Radio
} from '@mui/icons-material';

const KaraokePlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3분
  const [volume, setVolume] = useState(80);
  const [currentSong, setCurrentSong] = useState({
    title: "NEURAL DANCE",
    artist: "CYBER COLLECTIVE",
    genre: "SYNTHWAVE"
  });

  // 시간 업데이트 시뮬레이션
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipNext = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSkipPrevious = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
          }}>
            <MusicNote sx={{ color: '#000', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#00ffff',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
              }}
            >
              NEURAL PLAYER
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              HOLOGRAPHIC AUDIO SYSTEM
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip 
            label="LIVE" 
            size="small" 
            sx={{ 
              background: 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              fontWeight: 700
            }} 
          />
          <Chip 
            label="SYNC" 
            size="small" 
            sx={{ 
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              fontWeight: 700
            }} 
          />
        </Stack>
      </Box>

      {/* 현재 곡 정보 */}
      <Box sx={{ 
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        mb: 3,
        border: '1px solid rgba(0, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 49%, rgba(0, 255, 255, 0.05) 50%, transparent 51%)',
          animation: 'scan 4s linear infinite',
          '@keyframes scan': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '0.05em',
              mb: 1,
              textShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
            }}
          >
            {currentSong.title}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#00ffff',
              fontWeight: 500,
              mb: 0.5
            }}
          >
            {currentSong.artist}
          </Typography>
          <Chip 
            label={currentSong.genre}
            size="small"
            sx={{ 
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              fontWeight: 600
            }}
          />
        </Box>
      </Box>

      {/* 진행 바 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          >
            {formatTime(currentTime)}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          >
            {formatTime(duration)}
          </Typography>
        </Box>
        
        <Box sx={{ position: 'relative' }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentTime / duration) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                borderRadius: 4,
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
              }
            }}
          />
          
          {/* 진행 바 글로우 효과 */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${(currentTime / duration) * 100}%`,
            background: 'linear-gradient(90deg, #00ffff, #ff0080)',
            borderRadius: 4,
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
            opacity: 0.7
          }} />
        </Box>
      </Box>

      {/* 컨트롤 버튼들 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        mb: 3
      }}>
        <IconButton 
          onClick={handleSkipPrevious}
          sx={{
            color: '#888',
            '&:hover': {
              color: '#00ffff',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
            }
          }}
        >
          <SkipPrevious sx={{ fontSize: 32 }} />
        </IconButton>

        <Button
          onClick={handlePlayPause}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: isPlaying 
              ? 'linear-gradient(45deg, #ff0080, #ff4081)'
              : 'linear-gradient(45deg, #00ffff, #00bcd4)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isPlaying 
              ? '0 0 30px rgba(255, 0, 128, 0.5)'
              : '0 0 30px rgba(0, 255, 255, 0.5)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: isPlaying 
                ? '0 0 40px rgba(255, 0, 128, 0.7)'
                : '0 0 40px rgba(0, 255, 255, 0.7)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isPlaying ? (
            <Pause sx={{ color: '#fff', fontSize: 36 }} />
          ) : (
            <PlayArrow sx={{ color: '#fff', fontSize: 36 }} />
          )}
        </Button>

        <IconButton 
          onClick={handleSkipNext}
          sx={{
            color: '#888',
            '&:hover': {
              color: '#00ffff',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
            }
          }}
        >
          <SkipNext sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>

      {/* 볼륨 및 EQ 컨트롤 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolumeUp sx={{ color: '#00ffff', fontSize: 20 }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontFamily: 'monospace',
              minWidth: '30px'
            }}
          >
            {volume}%
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flex: 1,
          mx: 2
        }}>
          <Box sx={{
            height: 4,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            position: 'relative'
          }}>
            <Box sx={{
              height: '100%',
              width: `${volume}%`,
              background: 'linear-gradient(90deg, #00ffff, #ff0080)',
              borderRadius: 2,
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
            }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Equalizer sx={{ color: '#ff0080', fontSize: 20 }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontFamily: 'monospace'
            }}
          >
            AUTO
      </Typography>
        </Box>
      </Box>

      {/* 상태 인디케이터 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        mt: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          padding: '8px 16px',
          background: 'rgba(0, 255, 0, 0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 255, 0, 0.3)'
        }}>
          <Radio sx={{ 
            color: '#00ff00', 
            fontSize: 16,
            animation: isPlaying ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#00ff00',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            {isPlaying ? 'SYNC ACTIVE' : 'STANDBY'}
      </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default KaraokePlayer;
