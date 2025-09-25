import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, XCircle } from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuth';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

// 사이버틱 테마를 위한 CSS 애니메이션
const cyberpunkStyles = `
  @keyframes neonGlow {
    0%, 100% { 
      text-shadow: 
        0 0 20px #00ff88,
        0 0 40px #00ff88,
        0 0 60px #00ff88;
    }
    50% { 
      text-shadow: 
        0 0 10px #00ff88,
        0 0 20px #00ff88,
        0 0 30px #00ff88;
    }
  }
  
  @keyframes errorGlow {
    0%, 100% { 
      text-shadow: 
        0 0 20px #ff0080,
        0 0 40px #ff0080,
        0 0 60px #ff0080;
    }
    50% { 
      text-shadow: 
        0 0 10px #ff0080,
        0 0 20px #ff0080,
        0 0 30px #ff0080;
    }
  }
  
  @keyframes hologramScan {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
  }
  
  @keyframes cyberPulse {
    0%, 100% { 
      box-shadow: 
        0 0 20px rgba(0, 255, 136, 0.3),
        0 0 40px rgba(0, 255, 136, 0.2),
        inset 0 0 20px rgba(0, 255, 136, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 10px rgba(0, 255, 136, 0.2),
        0 0 20px rgba(0, 255, 136, 0.1),
        inset 0 0 10px rgba(0, 255, 136, 0.05);
    }
  }
`;

const LoginSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');
  const { login } = useAuthStore();
  const { fetchUserWithProfile } = useAuth();

  useEffect(() => {
    const processLogin = async () => {
      try {
        // URL 파라미터에서 accessToken 가져오기
        const accessToken = searchParams.get('accessToken');
        
        if (!accessToken) {
          throw new Error('액세스 토큰을 찾을 수 없습니다.');
        }

        // 토큰 저장
        const success = GoogleAuthService.handleLoginSuccess(accessToken);
        
        if (!success) {
          throw new Error('토큰 저장에 실패했습니다.');
        }

        // 백엔드에서 사용자 정보 가져오기 (토큰으로 인증된 상태)
        try {
          // 토큰으로 사용자 정보를 가져오는 API 호출
          const userData = await fetchUserWithProfile();
          
          if (!userData) {
            throw new Error('사용자 정보를 가져오는데 실패했습니다.');
          }
          
          // 스토어에 사용자 정보 저장
          login(userData);
          
          setStatus('success');
          setMessage('로그인이 완료되었습니다!');
          
          // 2초 후 리다이렉트
          setTimeout(() => {
            const redirectPath = GoogleAuthService.getRedirectPath();
            navigate(redirectPath);
          }, 2000);
          
        } catch (apiError) {
          console.error('사용자 정보 가져오기 실패:', apiError);
          throw new Error('사용자 정보를 가져오는데 실패했습니다.');
        }

      } catch (error) {
        console.error('로그인 처리 실패:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.');
        
        // 3초 후 랜딩 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    processLogin();
  }, [searchParams, navigate, login, fetchUserWithProfile]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <CircularProgress size={40} sx={{ color: '#00ffff' }} />;
      case 'success':
        return <CheckCircle size={40} style={{ color: '#00ff00' }} />;
      case 'error':
        return <XCircle size={40} style={{ color: '#ff0040' }} />;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <Box sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(-45deg, rgba(5, 15, 10, .35)15%, rgba(15, 5, 10, .85)),
          url(https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80) center 25% no-repeat fixed
        `,
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(0, 255, 136, 0.2) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.2) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)
          `,
          zIndex: 1
        }
      }}>
        <Box sx={{
          textAlign: 'center',
          background: `
            linear-gradient(135deg, 
              rgba(0, 0, 0, 0.95) 0%, 
              rgba(20, 20, 40, 0.9) 50%, 
              rgba(0, 0, 0, 0.95) 100%
            )
          `,
          border: '2px solid transparent',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: `
            0 25px 50px rgba(0, 0, 0, 0.8),
            0 15px 30px rgba(0, 0, 0, 0.6),
            inset 0 2px 0 rgba(255, 255, 255, 0.1),
            inset 0 -2px 0 rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05)
          `,
          backdropFilter: 'blur(30px)',
          maxWidth: '320px',
          minWidth: '280px',
          width: 'fit-content',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          transform: 'perspective(1200px) rotateX(8deg) rotateY(-2deg)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'perspective(1200px) rotateX(5deg) rotateY(-1deg) scale(1.02)',
            boxShadow: `
              0 30px 60px rgba(0, 0, 0, 0.9),
              0 20px 40px rgba(0, 0, 0, 0.7),
              inset 0 2px 0 rgba(255, 255, 255, 0.15),
              inset 0 -2px 0 rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.1)
            `,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
            animation: 'hologramScan 5s infinite',
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.03) 0%, 
                transparent 30%, 
                transparent 70%, 
                rgba(0, 0, 0, 0.15) 100%
              )
            `,
            borderRadius: '16px',
            zIndex: 0,
          }
        }}>
          {/* 상태 아이콘 */}
          <Box sx={{ 
            mb: 2, 
            position: 'relative', 
            zIndex: 3,
            '& svg': {
              filter: 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.6))'
            }
          }}>
            {getStatusIcon()}
          </Box>

        {/* 상태 메시지 */}
        <Typography variant="body2" sx={{
          color: status === 'success' ? '#00ff88' : '#ff4080',
          fontWeight: 'bold',
          marginBottom: '8px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 3,
          fontSize: '1rem'
        }}>
          {status === 'loading' && 'PROCESSING LOGIN...'}
          {status === 'success' && 'LOGIN SUCCESS!'}
          {status === 'error' && 'LOGIN FAILED!'}
        </Typography>

        <Typography variant="body2" sx={{
          color: '#ffffff',
          marginBottom: '10px',
          opacity: 0.9,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 3,
          fontSize: '0.8rem'
        }}>
          {message}
        </Typography>

        {/* 진행 상태 표시 */}
        {status === 'loading' && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            mt: 2,
            position: 'relative',
            zIndex: 3
          }}>
            <CircularProgress 
              size={30}
              sx={{
                color: '#00ff88'
              }}
            />
          </Box>
        )}

        {/* 리다이렉트 안내 */}
        {status === 'success' && (
          <Typography variant="body2" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 1,
            position: 'relative',
            zIndex: 3,
            fontSize: '0.8rem'
          }}>
            잠시 후 자동으로 이동합니다...
          </Typography>
        )}

        {status === 'error' && (
          <Typography variant="body2" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 1,
            position: 'relative',
            zIndex: 3,
            fontSize: '0.8rem'
          }}>
            3초 후 메인 페이지로 이동합니다...
          </Typography>
        )}
      </Box>
    </Box>
    </>
  );
};

export default LoginSuccessPage;