export interface Album {
  id: number;
  userId: number;
  title: string;
  description?: string;
  uploadId?: number;
  coverImageUrl?: string;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  uploadId?: number;
  isPublic: boolean;
}

export interface AlbumCreateRequest extends CreateAlbumRequest {}

export interface AlbumUpdateRequest extends UpdateAlbumRequest {}

export interface AlbumCoverUploadResponse {
  uploadId: number;
  imageUrl: string;
}

export interface AlbumCoverGenerateRequest {
  trackIds: string[];
  params: Record<string, unknown>;
  count?: number;
}

export interface UpdateAlbumRequest {
  title: string;
  description?: string;
  uploadId?: number;
  isPublic: boolean;
}

// Album Track 관련 타입들
export interface AlbumTrack {
  id: number;
  albumId: number;
  recordId: number;
  trackOrder: number;
  title: string;
  duration: number;
  audioUrl: string;
  createdAt: string;
}

export interface AddTrackRequest {
  recordId: number;
  trackOrder?: number;
}

export interface BulkAddTracksRequest {
  tracks: Array<{
    recordId: number;
    trackOrder?: number;
  }>;
}

export interface AlbumTracksResponse {
  albumId: number;
  tracks: AlbumTrack[];
  totalTracks: number;
}

export interface PlaybackResponse {
  currentTrack: AlbumTrack;
  nextTrack?: AlbumTrack;
  previousTrack?: AlbumTrack;
  hasNext: boolean;
  hasPrevious: boolean;
  totalTracks: number;
}

export interface AlbumListResponse {
  albums: Album[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MyPageStats {
  albumCount: number;
  recordingCount: number;
  followerCount: number;
  followingCount: number;
  totalPlays: number;
  totalLikes: number;
}

export interface MyPageAlbumListResponse extends AlbumListResponse {}

export interface MyPageLikedAlbumListResponse extends AlbumListResponse {}

export interface AlbumQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}