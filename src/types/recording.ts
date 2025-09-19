export interface PresignedUrlRequest {
  originalFilename: string;
  fileSize: number;
  contentType: string;
  durationSeconds: number;
}

export interface PresignedUrlResponse {
  uploadId: string;
  presignedUrl: string;
  s3Key: string;
  expirationTime: string;
}

export interface CreateRecordingRequest {
  title: string;
  uploadId: string;
  songId?: number;
  durationSeconds: number;
}

export interface Recording {
  id: number;
  userId: number;
  title: string;
  uploadId: string;
  songId?: number;
  durationSeconds: number;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  publicUrl?: string;
  s3Key: string;
  fileSize: number;
  contentType: string;
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
  uploadId: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface RecordingQueueItem {
  id: string;
  title: string;
  audioBlob: Blob;
  songId?: number;
  durationSeconds: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  uploadProgress?: UploadProgress;
  recordingId?: number;
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
  microphone: 'granted' | 'denied' | 'prompt';
  supported: boolean;
  error?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

export type RecordingSort = 'createdAt' | 'updatedAt' | 'title' | 'duration';
export type SortOrder = 'asc' | 'desc';

export interface RecordingFilters {
  search?: string;
  processingStatus?: Recording['processingStatus'];
  sortBy?: RecordingSort;
  sortOrder?: SortOrder;
}