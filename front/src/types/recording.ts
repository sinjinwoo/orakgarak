// API 요청/응답 타입들
export interface PresignedUrlRequest {
  originalFilename: string;
  fileSize: number;
  contentType: string;
  durationSeconds: number;
}

export interface PresignedUrlResponse {
  uploadId: number; // API 명세에서는 number로 되어 있음
  presignedUrl: string;
  s3Key: string;
  expirationTime: string;
}

export interface CreateRecordingRequest {
  title: string;
  uploadId: number; // number로 변경
  songId?: number;
  durationSeconds: number;
}

export interface Recording {
  id: number;
  title: string;
  userId: number;
  songId?: number;
  uploadId: number;
  durationSeconds: number;
  processingStatus:
    | "UPLOADED"
    | "PROCESSING"
    | "CONVERTING"
    | "ANALYSIS_PENDING"
    | "COMPLETED"
    | "FAILED";
  s3Key: string;
  publicUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 곡 검색 관련 타입들
export interface Song {
  id: number;
  songId: number;
  songName: string;
  artistName: string;
  albumName: string;
  musicUrl: string;
  lyrics: string; // JSON 문자열
  albumCoverUrl: string;
  spotifyTrackId: string;
  durationMs?: number;
  popularity?: number;
  status: string;
}

// 처리 상태 관련 타입들 (백엔드 응답에 맞게 수정)
export interface ProcessingStatus {
  uploadId: number;
  status: Recording["processingStatus"];
  progress?: number;
  message?: string;
  updatedAt: string;
}

export interface ProcessingStatusResponse {
  uploadId: number;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  processingStatus: Recording["processingStatus"];
  progress?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  audioData?: Blob;
}

export interface AudioRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  bitRate?: number;
  mimeType?: string;
}

export interface UploadProgress {
  uploadId: number;
  loaded: number;
  total: number;
  percentage: number;
  status: "idle" | "uploading" | "completed" | "error";
  error?: string;
}

export interface RecordingQueueItem {
  id: string;
  title: string;
  audioBlob: Blob;
  songId?: number;
  durationSeconds: number;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  uploadProgress?: UploadProgress;
  recordingId?: number;
  uploadId?: number;
  error?: string;
  createdAt: number;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  peak: number;
}

export interface RecordingPermissions {
  microphone: "granted" | "denied" | "prompt";
  supported: boolean;
  error?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

export type RecordingSort = "createdAt" | "updatedAt" | "title" | "duration";
export type SortOrder = "asc" | "desc";

export interface RecordingFilters {
  search?: string;
  processingStatus?: Recording["processingStatus"];
  sortBy?: RecordingSort;
  sortOrder?: SortOrder;
}
