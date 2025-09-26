import React from 'react';
import { Snackbar, Box } from '@mui/material';
import { useUIStore } from '../../stores/uiStore';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

// 네온 사이버펑크 테마를 위한 CSS 애니메이션
const neonToastStyles = `
  @keyframes neonGlow {
    0%, 100% { 
      text-shadow: 
        0 0 10px #ec4899,
        0 0 20px #ec4899,
        0 0 30px #ec4899;
    }
    50% { 
      text-shadow: 
        0 0 5px #ec4899,
        0 0 10px #ec4899,
        0 0 15px #ec4899;
    }
  }
  
  @keyframes cyanGlow {
    0%, 100% { 
      text-shadow: 
        0 0 10px #06b6d4,
        0 0 20px #06b6d4,
        0 0 30px #06b6d4;
    }
    50% { 
      text-shadow: 
        0 0 5px #06b6d4,
        0 0 10px #06b6d4,
        0 0 15px #06b6d4;
    }
  }
  
  @keyframes neonBorder {
    0%, 100% { 
      box-shadow: 
        0 0 10px #ec4899,
        0 0 20px #ec4899,
        inset 0 0 10px rgba(236, 72, 153, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 5px #ec4899,
        0 0 10px #ec4899,
        inset 0 0 5px rgba(236, 72, 153, 0.1);
    }
  }
  
  @keyframes cyanBorder {
    0%, 100% { 
      box-shadow: 
        0 0 10px #06b6d4,
        0 0 20px #06b6d4,
        inset 0 0 10px rgba(6, 182, 212, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 5px #06b6d4,
        0 0 10px #06b6d4,
        inset 0 0 5px rgba(6, 182, 212, 0.1);
    }
  }
  
  @keyframes hologramScan {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
  }
`;

const Toast: React.FC = () => {
  const { toasts, hideToast } = useUIStore();

  const handleClose = (id: string) => {
    hideToast(id);
  };

  const getToastConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          textGradient: 'linear-gradient(45deg, #00ff88, #00d4ff, #0099ff)',
          bgColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          animation: 'cyanGlow',
          title: '성공'
        };
      case 'error':
        return {
          icon: <XCircle size={20} />,
          textGradient: 'linear-gradient(45deg, #ff0080, #ff4080, #ff8080)',
          bgColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          animation: 'neonGlow',
          title: '오류'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          textGradient: 'linear-gradient(45deg, #ffaa00, #ff6600, #ff3300)',
          bgColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          animation: 'neonGlow',
          title: '경고'
        };
      default:
        return {
          icon: <Info size={20} />,
          textGradient: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00)',
          bgColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          animation: 'neonGlow',
          title: '알림'
        };
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: neonToastStyles }} />
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);
        
        return (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration || 4000}
            onClose={() => handleClose(toast.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              '& .MuiSnackbarContent-root': {
                padding: 0,
                backgroundColor: 'transparent',
                boxShadow: 'none', 
                minWidth: '200px',
                maxWidth: '200px',
                width: 'auto',  
              }
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 40, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                border: 'none',
                borderRadius: 2,
                padding: 1.5,
                minWidth: '160px',
                maxWidth: '200px',
                boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.03)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  animation: 'hologramScan 3s infinite',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: config.textGradient,
                  opacity: 0.05,
                  borderRadius: 2,
                  zIndex: 0,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                <Box 
                  sx={{ 
                    background: config.textGradient,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: `${config.animation} 2s ease-in-out infinite`,
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
                    '& svg': {
                      width: 16,
                      height: 16
                    }
                  }}
                >
                  {config.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      background: config.textGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
                      animation: `${config.animation} 2s ease-in-out infinite`,
                      mb: 0.3,
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
                    }}
                  >
                    {config.title}
                  </Box>
                  <Box
                    sx={{
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                      filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))',
                      opacity: 0.9
                    }}
                  >
                    {toast.message}
                  </Box>
                </Box>
                <Box
                  onClick={() => handleClose(toast.id)}
                  sx={{
                    background: config.textGradient,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    cursor: 'pointer',
                    padding: 0.3,
                    borderRadius: 1,
                    filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      animation: `${config.animation} 1s ease-in-out infinite`,
                      filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.5))',
                    },
                    '& svg': {
                      width: 12,
                      height: 12
                    }
                  }}
                >
                  <XCircle size={16} />
                </Box>
              </Box>
            </Box>
          </Snackbar>
        );
      })}
    </>
  );
};

export default Toast;
