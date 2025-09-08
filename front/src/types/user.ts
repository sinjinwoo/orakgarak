export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
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
