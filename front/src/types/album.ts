export interface Album {
  id: number;
  userId: number;
  title: string;
  description: string;
  uploadId: number;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  likeCount: number;
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

// 앨범 생성 요청 타입
export interface AlbumCreateRequest {
  title: string;
  description: string;
  uploadId: number;
  isPublic: boolean;
}

// 앨범 수정 요청 타입
export interface AlbumUpdateRequest {
  title: string;
  description: string;
  uploadId: number;
  isPublic: boolean;
}

// 앨범 커버 업로드 응답 타입
export interface AlbumCoverUploadResponse {
  uploadId: number;
  presignedUrl: string;
  s3Key: string;
  originalFileName: string;
}

// AI 앨범 커버 생성 요청 타입
export interface AlbumCoverGenerateRequest {
  uploadIds: number[];
}

// 페이지네이션된 앨범 목록 응답 타입
export interface AlbumListResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: Album[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  empty: boolean;
}

// 앨범 쿼리 파라미터 타입
export interface AlbumQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

// 트랙 추가 요청 타입
export interface AddTrackRequest {
  recordId: number;
  trackOrder: number;
}

// 여러 트랙 일괄 추가 요청 타입
export interface BulkAddTracksRequest {
  tracks: AddTrackRequest[];
}

// 앨범 트랙 목록 응답 타입
export interface AlbumTracksResponse {
  tracks: AlbumTrack[];
  albumInfo: {
    id: number;
    title: string;
    trackCount: number;
  };
}

// 재생 정보 응답 타입
export interface PlaybackResponse {
  audioUrl: string;
  currentTrack: AlbumTrack;
  nextTrack?: AlbumTrack;
  previousTrack?: AlbumTrack;
}

// API 에러 타입
export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

// 타입 별칭
export type CreateAlbumRequest = AlbumCreateRequest;
export type UpdateAlbumRequest = AlbumUpdateRequest;

// 기존 타입 호환성을 위해 유지
export interface AlbumCreateData {
  title: string;
  description?: string;
  coverImage?: string;
  recordingIds: string[];
  isPublic: boolean;
  tags: string[];
}
