import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recordingService } from '../services/recordingApi';
import {
  Recording,
  CreateRecordingRequest,
  PresignedUrlRequest,
  RecordingFilters,
  ApiError,
  UploadProgress,
  RecordingQueueItem
} from '../types/recording';
import { uploadToS3, validateAudioFile, generateUniqueId } from '../utils/fileUpload';
import { useRecordingStore } from '../stores/recordingStore';
import { toast } from 'react-toastify';

export const RECORDING_QUERY_KEYS = {
  all: ['recordings'] as const,
  lists: () => [...RECORDING_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: RecordingFilters) => [...RECORDING_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECORDING_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...RECORDING_QUERY_KEYS.details(), id] as const,
};

export const useMyRecordings = (filters?: RecordingFilters) => {
  return useQuery<Recording[], ApiError>({
    queryKey: RECORDING_QUERY_KEYS.list(filters),
    queryFn: () => recordingService.getMyRecordings(filters),
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useRecording = (recordingId: number, enabled: boolean = true) => {
  return useQuery<Recording, ApiError>({
    queryKey: RECORDING_QUERY_KEYS.detail(recordingId),
    queryFn: () => recordingService.getRecording(recordingId),
    enabled: enabled && !!recordingId,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCreateRecording = () => {
  const queryClient = useQueryClient();

  return useMutation<Recording, ApiError, CreateRecordingRequest>({
    mutationFn: recordingService.createRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECORDING_QUERY_KEYS.lists() });
      toast.success('녹음이 성공적으로 생성되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '녹음 생성에 실패했습니다.');
    },
  });
};

export const useDeleteRecording = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: recordingService.deleteRecording,
    onSuccess: (_, recordingId) => {
      queryClient.invalidateQueries({ queryKey: RECORDING_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: RECORDING_QUERY_KEYS.detail(recordingId) });
      toast.success('녹음이 성공적으로 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '녹음 삭제에 실패했습니다.');
    },
  });
};

export const usePresignedUrl = () => {
  return useMutation<any, ApiError, PresignedUrlRequest>({
    mutationFn: recordingService.getPresignedUrl,
    onError: (error) => {
      toast.error(error.message || 'Presigned URL 생성에 실패했습니다.');
    },
  });
};

interface ProcessRecordingParams {
  title: string;
  audioBlob: Blob;
  songId?: number;
  durationSeconds: number;
}

export const useProcessRecording = () => {
  const queryClient = useQueryClient();
  const { addToQueue, updateQueueItem, removeFromQueue, setUploadProgress } = useRecordingStore();
  const getPresignedUrl = usePresignedUrl();
  const createRecording = useCreateRecording();

  return useMutation<Recording, ApiError, ProcessRecordingParams>({
    mutationFn: async ({ title, audioBlob, songId, durationSeconds }) => {
      const queueId = generateUniqueId();

      try {
        validateAudioFile(audioBlob);

        const queueItem: RecordingQueueItem = {
          id: queueId,
          title,
          audioBlob,
          songId,
          durationSeconds,
          status: 'pending',
          createdAt: Date.now(),
        };

        addToQueue(queueItem);

        updateQueueItem(queueId, { status: 'uploading' });

        const presignedData = await getPresignedUrl.mutateAsync({
          originalFilename: `${title}.${audioBlob.type.split('/')[1] || 'webm'}`,
          fileSize: audioBlob.size,
          contentType: audioBlob.type,
          durationSeconds,
        });

        const uploadResult = await uploadToS3({
          presignedUrl: presignedData.presignedUrl,
          file: audioBlob,
          contentType: audioBlob.type,
          uploadId: presignedData.uploadId,
          onProgress: (progress: UploadProgress) => {
            setUploadProgress(queueId, progress);
          },
        });

        if (!uploadResult.success) {
          throw new Error('파일 업로드에 실패했습니다.');
        }

        updateQueueItem(queueId, { status: 'processing' });

        const recording = await createRecording.mutateAsync({
          title,
          uploadId: presignedData.uploadId,
          songId,
          durationSeconds,
        });

        updateQueueItem(queueId, {
          status: 'completed',
          recordingId: recording.id,
        });

        setTimeout(() => {
          removeFromQueue(queueId);
        }, 5000);

        return recording;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

        updateQueueItem(queueId, {
          status: 'failed',
          error: errorMessage,
        });

        throw error;
      }
    },
    onError: (error) => {
      toast.error(error.message || '녹음 처리에 실패했습니다.');
    },
  });
};

export const useProcessingStatus = (recordingId: number, enabled: boolean = false) => {
  return useQuery<Recording, ApiError>({
    queryKey: [...RECORDING_QUERY_KEYS.detail(recordingId), 'status'],
    queryFn: () => recordingService.checkProcessingStatus(recordingId),
    enabled: enabled && !!recordingId,
    refetchInterval: (data) => {
      if (!data || data.processingStatus === 'COMPLETED' || data.processingStatus === 'FAILED') {
        return false;
      }
      return 3000;
    },
    retry: false,
    staleTime: 0,
  });
};

export const usePrefetchRecording = () => {
  const queryClient = useQueryClient();

  return (recordingId: number) => {
    queryClient.prefetchQuery({
      queryKey: RECORDING_QUERY_KEYS.detail(recordingId),
      queryFn: () => recordingService.getRecording(recordingId),
      staleTime: 2 * 60 * 1000,
    });
  };
};

export const useRecordingMutations = () => {
  const createRecording = useCreateRecording();
  const deleteRecording = useDeleteRecording();
  const processRecording = useProcessRecording();

  return {
    createRecording,
    deleteRecording,
    processRecording,
    isLoading: createRecording.isPending || deleteRecording.isPending || processRecording.isPending,
  };
};

export const useBulkDeleteRecordings = () => {
  const queryClient = useQueryClient();
  const deleteRecording = useDeleteRecording();

  return useMutation<void, ApiError, number[]>({
    mutationFn: async (recordingIds: number[]) => {
      const deletePromises = recordingIds.map(id => recordingService.deleteRecording(id));
      await Promise.all(deletePromises);
    },
    onSuccess: (_, recordingIds) => {
      queryClient.invalidateQueries({ queryKey: RECORDING_QUERY_KEYS.lists() });
      recordingIds.forEach(id => {
        queryClient.removeQueries({ queryKey: RECORDING_QUERY_KEYS.detail(id) });
      });
      toast.success(`${recordingIds.length}개의 녹음이 성공적으로 삭제되었습니다.`);
    },
    onError: (error) => {
      toast.error(error.message || '녹음 삭제에 실패했습니다.');
    },
  });
};