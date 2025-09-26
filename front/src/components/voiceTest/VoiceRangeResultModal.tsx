import React from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';
import { motion } from 'framer-motion';
import { MusicNote, TrendingUp, TrendingDown, Refresh, Close } from '@mui/icons-material';

interface VoiceRangeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  highestNote?: string;
  lowestNote?: string;
  highestFrequency?: number;
  lowestFrequency?: number;
  totalScore?: number;
}

const VoiceRangeResultModal: React.FC<VoiceRangeResultModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  highestNote,
  lowestNote,
  highestFrequency,
  lowestFrequency,
  totalScore,
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
        backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Box
          sx={{
            width: '520px',
            maxWidth: '90vw',
            position: 'relative',
            background: `
              radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
              linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
            `,
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 0 24px rgba(236, 72, 153, 0.3), 0 0 24px rgba(6, 182, 212, 0.3)',
            p: 3,
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}
        >
        {/* 콘텐츠 */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* 제목 */}
          <Typography
            variant="h6"
            sx={{
              background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              mb: 2,
              letterSpacing: '1px'
            }}
          >
            🎵 테스트 결과
          </Typography>

          {/* 결과 표시 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              gap: 2,
              mb: 2
            }}
          >
            {/* 총점 표시 */}
            <Box
              sx={{
                flex: 1,
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid rgba(236, 72, 153, 0.5)',
                borderRadius: '12px',
                p: 2,
                textAlign: 'center',
                minWidth: 0
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#ec4899',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                🏆 총점
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                {totalScore?.toLocaleString() || '0'}
              </Typography>
            </Box>

            {/* 최고 음역대 */}
            <Box
              sx={{
                flex: 1,
                background: 'rgba(0, 255, 136, 0.08)',
                border: '1px solid rgba(0, 255, 136, 0.6)',
                borderRadius: '12px',
                p: 2,
                textAlign: 'center',
                minWidth: 0
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#00ff88',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                🎼 최고 음역대
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                {highestNote || 'C4'}
              </Typography>
              {highestFrequency && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5, fontFamily: 'monospace' }}
                >
                  {highestFrequency.toFixed(1)} Hz
                </Typography>
              )}
            </Box>

            {/* 최저 음역대 */}
            <Box
              sx={{
                flex: 1,
                background: 'rgba(255, 0, 68, 0.08)',
                border: '1px solid rgba(255, 0, 68, 0.6)',
                borderRadius: '12px',
                p: 2,
                textAlign: 'center',
                minWidth: 0
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#ff0044',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                🎵 최저 음역대
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                {lowestNote || 'C3'}
              </Typography>
              {lowestFrequency && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5, fontFamily: 'monospace' }}
                >
                  {lowestFrequency.toFixed(1)} Hz
                </Typography>
              )}
            </Box>
          </Box>

          {/* 버튼들 */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              justifyContent: 'center'
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                color: '#00ff88',
                borderColor: '#00ff88',
                px: 3,
                py: 1,
                borderRadius: '20px',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { borderColor: '#00ff88', backgroundColor: 'rgba(0, 255, 136, 0.08)' }
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
                px: 3,
                py: 1,
                borderRadius: '20px',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(0, 255, 136, 0.25)',
                '&:hover': { background: 'linear-gradient(45deg, #00ffaa, #00e695)' }
              }}
            >
              녹음 하러 가기
            </Button>
          </Box>
        </Box>

        {/* CSS 애니메이션 */}
        <style>
          {`
            @keyframes cyberGlow { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
            @keyframes gridMove { 0% { transform: translate(0, 0); } 100% { transform: translate(50px, 50px); } }
          `}
        </style>
        </Box>
      </motion.div>
    </Modal>
  );
};

export default VoiceRangeResultModal;
