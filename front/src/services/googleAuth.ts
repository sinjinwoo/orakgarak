// 백엔드 OAuth2 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const GOOGLE_OAUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  /**
   * 구글 로그인 리다이렉트
   * 백엔드의 /oauth2/authorization/google 엔드포인트로 리다이렉트
   */
  static initiateGoogleLogin(): void {
    // 현재 페이지 URL을 저장 (로그인 후 돌아올 페이지)
    const currentPath = window.location.pathname;
    localStorage.setItem('pre-login-path', currentPath);
    
    // 구글 OAuth2 엔드포인트로 리다이렉트
    window.location.href = GOOGLE_OAUTH_URL;
  }

  /**
   * 로그인 성공 페이지에서 토큰 처리
   */
  static handleLoginSuccess(accessToken: string): boolean {
    try {
      if (!accessToken) {
        throw new Error('액세스 토큰이 없습니다.');
      }

      // 토큰을 localStorage에 저장
      localStorage.setItem('auth-token', accessToken);
      localStorage.setItem('token-created-time', Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('로그인 성공 처리 실패:', error);
      return false;
    }
  }

  /**
   * 로그인 후 리다이렉트할 페이지 결정
   */
  static getRedirectPath(): string {
    const savedPath = localStorage.getItem('pre-login-path');
    localStorage.removeItem('pre-login-path');
    
    // 저장된 경로가 있고, 로그인 관련 페이지가 아니면 해당 페이지로
    if (savedPath && !savedPath.includes('/login')) {
      return savedPath;
    }
    
    // 기본적으로 랜딩 페이지로
    return '/';
  }
}

// 구글 로그인 시작 함수
export const initiateGoogleLogin = (): void => {
  GoogleAuthService.initiateGoogleLogin();
};
