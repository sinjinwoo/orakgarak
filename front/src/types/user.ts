export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 백엔드 Profile API 응답 타입
export interface Profile {
  id: number;
  userId: number;
  profileImageUrl: string;
  backgroundImageUrl?: string;
  nickname: string;
  gender: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 프로필 업데이트 요청 타입 (사진 제외)
export interface ProfileUpdateRequest {
  nickname: string;
  gender: string;
  description: string;
}

// 프로필 이미지 업데이트 요청 타입
export interface ProfileImageUpdateRequest {
  image: File;
  nickname?: string;
  gender?: string;
  description?: string;
}

export interface UserProfile extends User {
  followerCount: number;
  followingCount: number;
  albumCount: number;
  recordingCount: number;
  totalLikes: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthStore extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}