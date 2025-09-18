import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { GoogleAuthService } from '../services/googleAuth';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/backend';

const LoginSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');
  const { login } = useAuthStore();

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
          const userResponse = await authAPI.getUserInfo();
          const userData = userResponse.data;
          
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
  }, [searchParams, navigate, login]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <CircularProgress size={60} sx={{ color: '#00ffff' }} />;
      case 'success':
        return <CheckCircle sx={{ fontSize: 60, color: '#00ff00' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 60, color: '#ff0040' }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return '#00ffff';
      case 'success':
        return '#00ff00';
      case 'error':
        return '#ff0040';
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
        linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Box sx={{
        textAlign: 'center',
        background: 'rgba(26, 26, 26, 0.9)',
        border: `2px solid ${getStatusColor()}`,
        borderRadius: '15px',
        padding: '40px',
        boxShadow: `0 0 30px ${getStatusColor()}40`,
        backdropFilter: 'blur(10px)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* 상태 아이콘 */}
        <Box sx={{ mb: 3 }}>
          {getStatusIcon()}
        </Box>

        {/* 상태 메시지 */}
        <Typography variant="h5" sx={{
          color: getStatusColor(),
          fontWeight: 'bold',
          marginBottom: '16px',
          textShadow: `0 0 10px ${getStatusColor()}`
        }}>
          {status === 'loading' && 'PROCESSING LOGIN...'}
          {status === 'success' && 'LOGIN SUCCESS!'}
          {status === 'error' && 'LOGIN FAILED!'}
        </Typography>

        <Typography variant="body1" sx={{
          color: '#ffffff',
          marginBottom: '20px',
          opacity: 0.9
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
            mt: 2
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00ffff',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00ffff',
              animation: 'pulse 1.5s ease-in-out infinite 0.2s'
            }} />
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00ffff',
              animation: 'pulse 1.5s ease-in-out infinite 0.4s'
            }} />
          </Box>
        )}

        {/* 리다이렉트 안내 */}
        {status === 'success' && (
          <Typography variant="body2" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2
          }}>
            잠시 후 자동으로 이동합니다...
          </Typography>
        )}

        {status === 'error' && (
          <Typography variant="body2" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2
          }}>
            3초 후 메인 페이지로 이동합니다...
          </Typography>
        )}
      </Box>

      {/* 애니메이션 스타일 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `
      }} />
    </Box>
  );
};

export default LoginSuccessPage;
