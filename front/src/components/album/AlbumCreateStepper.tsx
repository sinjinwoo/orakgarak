import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Mic, 
  Image, 
  FileText, 
  Eye, 
  Check,
  ArrowRight
} from 'lucide-react';
import { theme } from '../../styles/theme';

const steps = [
  { 
    label: '녹음 선택', 
    description: 'Recordings Selection', 
    icon: Mic,
    color: '#FF6B9D'
  },
  { 
    label: '커버 선택', 
    description: 'Cover Selection', 
    icon: Image,
    color: '#8B5CF6'
  },
  { 
    label: '앨범 정보', 
    description: 'Album Info', 
    icon: FileText,
    color: '#06B6D4'
  },
  { 
    label: '미리보기', 
    description: 'Preview', 
    icon: Eye,
    color: '#10B981'
  },
];

interface AlbumCreateStepperProps {
  currentStep: number;
}

const AlbumCreateStepper: React.FC<AlbumCreateStepperProps> = ({ currentStep }) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* 상단 진행률 표시 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ 
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '1.1rem'
          }}>
            {steps[currentStep]?.label || '앨범 생성 중...'}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            backdropFilter: 'blur(10px)'
          }}>
            {Math.round(progressPercentage)}%
          </Typography>
        </Box>

        {/* 진행률 게이지 바 */}
        <Box sx={{ 
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          height: 8,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 3
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${steps[currentStep]?.color || '#FF6B9D'} 0%, ${steps[currentStep]?.color || '#C147E9'} 100%)`,
              borderRadius: 3,
              boxShadow: `0 0 20px ${steps[currentStep]?.color || '#FF6B9D'}40`,
            }}
          />
        </Box>
      </Box>

      {/* 화살표 스테퍼 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1
      }}>
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={step.label}>
              {/* 스테퍼 박스 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1,
                  x: 0
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1
                }}
                whileHover={{ scale: 1.02 }}
              >
                <Box sx={{
                  position: 'relative',
                  minWidth: 200,
                  height: 80,
                  background: isCompleted 
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`
                    : isCurrent
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`
                    : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  border: isCompleted || isCurrent
                    ? `2px solid ${step.color}40`
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isCompleted || isCurrent 
                    ? `0 8px 32px ${step.color}40`
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 아이콘과 텍스트 */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    <motion.div
                      animate={{ 
                        rotate: isCurrent ? [0, 10, -10, 0] : 0,
                        scale: isCurrent ? [1, 1.1, 1] : 1
                      }}
                      transition={{ 
                        duration: 0.6,
                        repeat: isCurrent ? Infinity : 0,
                        repeatDelay: 2
                      }}
                    >
                      {isCompleted ? (
                        <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <IconComponent 
                          size={20} 
                          color={isCurrent || isCompleted ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"} 
                          strokeWidth={2}
                        />
                      )}
                    </motion.div>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" sx={{
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        mb: 0.5
                      }}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" sx={{
                        color: isCurrent || isCompleted 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.75rem'
                      }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 현재 단계 펄스 효과 */}
                  {isCurrent && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 8,
                        border: `2px solid ${step.color}`,
                        backgroundColor: 'transparent'
                      }}
                    />
                  )}
                </Box>
              </motion.div>

              {/* 화살표 연결선 */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: index < currentStep ? 1 : 0.3,
                    opacity: index < currentStep ? 1 : 0.3
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Box sx={{
                    width: 0,
                    height: 0,
                    borderTop: '20px solid transparent',
                    borderBottom: '20px solid transparent',
                    borderLeft: `25px solid ${index < currentStep ? step.color : 'rgba(255, 255, 255, 0.3)'}`,
                    filter: index < currentStep ? `drop-shadow(0 0 8px ${step.color}40)` : 'none',
                    zIndex: 10,
                    position: 'relative'
                  }} />
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

export default AlbumCreateStepper;
