package com.ssafy.lab.orak.upload.repository;

import com.ssafy.lab.orak.upload.entity.Upload;

import java.time.LocalDateTime;
import java.util.List;

public interface UploadRepositoryCustom {

    /**
     * 오디오 파일 중 처리가 필요한 업로드 조회 (배치 처리용)
     */
    List<Upload> findPendingAudioProcessing(int limit);

    /**
     * 재시도 로직을 포함한 오디오 파일 처리 대기 조회
     */
    List<Upload> findPendingAudioProcessingWithRetry(int limit, int maxRetries, LocalDateTime retryAfterTime);

    /**
     * 처리 중인 파일 개수 조회
     */
    long countProcessingFiles();

    /**
     * 특정 기간 내 처리 완료된 파일 조회
     */
    List<Upload> findCompletedBetween(LocalDateTime startDate, LocalDateTime endDate);
}