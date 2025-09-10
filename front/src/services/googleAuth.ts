import { OAuth2Client } from 'google-auth-library';

// 구글 OAuth 클라이언트 설정
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  /**
   * 구글 로그인 팝업을 열고 사용자 정보를 가져옵니다
   * 백엔드 API가 준비되지 않았으므로 임시로 더미 로그인을 사용합니다
   */
  static async signInWithPopup(): Promise<GoogleUserInfo | null> {
    try {
      // 임시: 사용자 확인을 위한 간단한 팝업
      const confirmed = window.confirm(
        '구글 로그인을 시도하시겠습니까?\n\n' +
        '(현재는 백엔드 API가 준비되지 않아 더미 로그인을 사용합니다)'
      );

      if (!confirmed) {
        return null;
      }

      // 더미 사용자 정보 반환
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      
      return {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: '구글 사용자',
        picture: 'https://via.placeholder.com/150'
      };

    } catch (error) {
      console.error('구글 로그인 실패:', error);
      return null;
    }
  }


  /**
   * 구글 토큰 검증
   */
  static async verifyToken(token: string): Promise<GoogleUserInfo | null> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture
      };
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      return null;
    }
  }
}

// 구글 로그인 버튼 컴포넌트를 위한 유틸리티 함수
export const openGoogleLogin = async (): Promise<GoogleUserInfo | null> => {
  return await GoogleAuthService.signInWithPopup();
};
