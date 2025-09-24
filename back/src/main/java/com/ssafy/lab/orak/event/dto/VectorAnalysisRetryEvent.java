package com.ssafy.lab.orak.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 벡터 분석 재시도 이벤트 DTO
 * - 음성분석 실패 시 Kafka를 통한 재시도 처리
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class VectorAnalysisRetryEvent {

    private String eventId;
    private String eventType;
    private String source;

    // 벡터 분석 관련 정보
    private Long recordId;
    private Long uploadId;
    private Long userId;
    private Long songId;

    // 재시도 관련 정보
    private Integer currentRetryCount;
    private Integer maxRetries;
    private String errorMessage;
    private String retryReason;

    // 이벤트 메타데이터
    private LocalDateTime eventTime;
    private LocalDateTime scheduleTime; // 언제 재시도할지
    private String priority;

    /**
     * 벡터 분석 즉시 재시도 이벤트 생성
     */
    public static VectorAnalysisRetryEvent createImmediateRetryEvent(
            Long recordId, Long uploadId, Long userId, Long songId,
            Integer currentRetryCount, Integer maxRetries, String errorMessage) {

        return VectorAnalysisRetryEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("VECTOR_ANALYSIS_IMMEDIATE_RETRY")
                .source("vector-analysis")
                .recordId(recordId)
                .uploadId(uploadId)
                .userId(userId)
                .songId(songId)
                .currentRetryCount(currentRetryCount)
                .maxRetries(maxRetries)
                .errorMessage(errorMessage)
                .retryReason("immediate_retry_after_failure")
                .eventTime(LocalDateTime.now())
                .scheduleTime(LocalDateTime.now()) // 즉시 처리
                .priority("HIGH")
                .build();
    }

    /**
     * 벡터 분석 지연 재시도 이벤트 생성
     */
    public static VectorAnalysisRetryEvent createDelayedRetryEvent(
            Long recordId, Long uploadId, Long userId, Long songId,
            Integer currentRetryCount, Integer maxRetries, String errorMessage,
            LocalDateTime scheduleTime) {

        return VectorAnalysisRetryEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("VECTOR_ANALYSIS_DELAYED_RETRY")
                .source("vector-analysis")
                .recordId(recordId)
                .uploadId(uploadId)
                .userId(userId)
                .songId(songId)
                .currentRetryCount(currentRetryCount)
                .maxRetries(maxRetries)
                .errorMessage(errorMessage)
                .retryReason("delayed_retry_after_backoff")
                .eventTime(LocalDateTime.now())
                .scheduleTime(scheduleTime)
                .priority("MEDIUM")
                .build();
    }

    /**
     * 재시도 가능한지 확인
     */
    public boolean canRetry() {
        return currentRetryCount != null && maxRetries != null &&
               currentRetryCount < maxRetries;
    }

    /**
     * 지연된 재시도인지 확인
     */
    public boolean isDelayedRetry() {
        return scheduleTime != null && scheduleTime.isAfter(LocalDateTime.now());
    }
}