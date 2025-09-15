import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';

const steps = [
  { label: '녹음 선택', description: 'Recordings Selection', icon: '🎵' },
  { label: '커버 선택', description: 'Cover Selection', icon: '🎨' },
  { label: '앨범 정보', description: 'Album Info', icon: '📝' },
  { label: '미리보기', description: 'Preview', icon: '👁️' },
];

interface AlbumCreateStepperProps {
  currentStep: number;
}

const AlbumCreateStepper: React.FC<AlbumCreateStepperProps> = ({ currentStep }) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* 게이지 바 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          height: 8,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              height: '100%',
              background: theme.colors.primary.gradient,
              borderRadius: 2,
              boxShadow: '0 0 20px rgba(196, 71, 233, 0.5)',
            }}
          />
        </Box>
        
        {/* 진행률 텍스트 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 1
        }}>
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem'
          }}>
            {steps[currentStep]?.label || '앨범 생성 중...'}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {Math.round(progressPercentage)}%
          </Typography>
        </Box>
      </Box>

      {/* 단계별 아이콘과 라벨 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        position: 'relative',
        px: 1
      }}>
        {steps.map((step, index) => (
          <Box key={step.label} sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            flex: 1,
            position: 'relative'
          }}>
            {/* 아이콘 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ 
                scale: index <= currentStep ? 1.1 : 0.8,
                opacity: index <= currentStep ? 1 : 0.6
              }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: index < currentStep 
                  ? 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)'
                  : index === currentStep
                  ? 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: index <= currentStep 
                  ? '2px solid rgba(255, 255, 255, 0.3)'
                  : '2px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: index <= currentStep 
                  ? '0 4px 20px rgba(196, 71, 233, 0.4)'
                  : 'none',
                fontSize: '1.5rem',
                mb: 1,
                position: 'relative',
                zIndex: 2
              }}>
                {index < currentStep ? '✓' : step.icon}
              </Box>
            </motion.div>

            {/* 라벨 */}
            <Typography variant="caption" sx={{
              color: index <= currentStep 
                ? '#FFFFFF' 
                : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: index <= currentStep ? 600 : 400,
              textAlign: 'center',
              maxWidth: 60,
              lineHeight: 1.2
            }}>
              {step.label}
            </Typography>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <Box sx={{
                position: 'absolute',
                top: 24,
                left: 'calc(50% + 24px)',
                right: 'calc(-50% + 24px)',
                height: 2,
                backgroundColor: index < currentStep 
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
                zIndex: 1
              }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AlbumCreateStepper;
