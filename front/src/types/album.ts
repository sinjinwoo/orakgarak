export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  userId: string;
  user: {
    nickname: string;
    profileImage?: string;
  };
  tracks: AlbumTrack[];
  isPublic: boolean;
  tags: string[];
  likeCount: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumTrack {
  id: string;
  recordingId: string;
  recording: {
    song: {
      title: string;
      artist: string;
    };
    audioUrl: string;
    duration: number;
  };
  trackNumber: number;
  title?: string; // 커스텀 트랙 제목
}

export interface AlbumCreateData {
  title: string;
  description?: string;
  coverImage?: string;
  recordingIds: string[];
  isPublic: boolean;
  tags: string[];
}
