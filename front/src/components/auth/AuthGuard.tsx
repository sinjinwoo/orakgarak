import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import LandingPage from '../../pages/LandingPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중일 때는 로딩 스피너 표시
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        로딩 중...
      </div>
    );
  }

  // 인증되지 않은 사용자는 랜딩 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // 인증된 사용자만 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default AuthGuard;
