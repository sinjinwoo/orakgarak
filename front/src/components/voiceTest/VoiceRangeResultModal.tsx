import React from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';

interface VoiceRangeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  highestNote?: string;
  lowestNote?: string;
  highestFrequency?: number;
  lowestFrequency?: number;
}

const VoiceRangeResultModal: React.FC<VoiceRangeResultModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  highestNote,
  lowestNote,
  highestFrequency,
  lowestFrequency,
}) => {
  console.log('🎮 VoiceRangeResultModal 렌더링:', { 
    isOpen, 
    highestNote, 
    lowestNote, 
    highestFrequency, 
    lowestFrequency 
  });
  
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="voice-range-result-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '600px',
          maxWidth: '90vw',
          background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
          borderRadius: '25px',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.3), inset 0 0 40px rgba(0, 255, 136, 0.05)',
          border: '3px solid #00ff88',
          p: 4,
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(5px)',
        }}
      >
        {/* 사이버펑크 배경 효과 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 20% 80%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 0, 68, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(0, 255, 255, 0.05) 0%, transparent 50%)
            `,
            animation: 'cyberGlow 4s ease-in-out infinite alternate',
            zIndex: 0,
          }}
        />

        {/* 네온 그리드 배경 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
            zIndex: 0,
          }}
        />

        {/* 콘텐츠 */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* 제목 */}
          <Typography
            variant="h4"
            sx={{
              color: '#00ff88',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 3,
              textShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
              background: 'linear-gradient(45deg, #00ff88, #00ffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '2px',
            }}
          >
            🎵 음역대 테스트 결과
          </Typography>

          {/* 결과 표시 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              mb: 4,
            }}
          >
            {/* 최고 음역대 */}
            <Box
              sx={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '2px solid #00ff88',
                borderRadius: '15px',
                p: 3,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#00ff88',
                  fontWeight: 'bold',
                  mb: 1,
                  textShadow: '0 0 5px rgba(0, 255, 136, 0.5)',
                }}
              >
                🎼 최고 음역대
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                }}
              >
                {highestNote || 'C4'}
              </Typography>
              {highestFrequency && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mt: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  {highestFrequency.toFixed(1)} Hz
                </Typography>
              )}
            </Box>

            {/* 최저 음역대 */}
            <Box
              sx={{
                background: 'rgba(255, 0, 68, 0.1)',
                border: '2px solid #ff0044',
                borderRadius: '15px',
                p: 3,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#ff0044',
                  fontWeight: 'bold',
                  mb: 1,
                  textShadow: '0 0 5px rgba(255, 0, 68, 0.5)',
                }}
              >
                🎵 최저 음역대
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                }}
              >
                {lowestNote || 'C3'}
              </Typography>
              {lowestFrequency && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mt: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  {lowestFrequency.toFixed(1)} Hz
                </Typography>
              )}
            </Box>
          </Box>

          {/* 설명 */}
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            테스트를 통해 측정된 당신의 음역대입니다.
            <br />
            이제 추천받기를 통해 맞춤형 노래를 찾아보세요!
          </Typography>

          {/* 버튼들 */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                color: '#00ff88',
                borderColor: '#00ff88',
                px: 4,
                py: 1.5,
                borderRadius: '25px',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  borderColor: '#00ff88',
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                },
              }}
            >
              다시 테스트
            </Button>
            <Button
              variant="contained"
              onClick={onContinue}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00cc66)',
                color: '#000000',
                px: 4,
                py: 1.5,
                borderRadius: '25px',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00ffaa, #00e695)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 255, 170, 0.4)',
                },
              }}
            >
              확인
            </Button>
          </Box>
        </Box>

        {/* CSS 애니메이션 */}
        <style>
          {`
            @keyframes cyberGlow {
              0% { opacity: 0.3; }
              100% { opacity: 0.7; }
            }
            
            @keyframes gridMove {
              0% { transform: translate(0, 0); }
              100% { transform: translate(50px, 50px); }
            }
          `}
        </style>
      </Box>
    </Modal>
  );
};

export default VoiceRangeResultModal;
