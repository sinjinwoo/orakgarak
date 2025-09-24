package com.ssafy.lab.orak.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 벡터 분석 시작 이벤트 DTO
 * - WAV 변환 완료 후 벡터 분석 시작 이벤트
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class VectorAnalysisEvent {

    private String eventId;
    private String eventType;
    private String source;

    // 벡터 분석 대상 정보
    private Long recordId;
    private Long uploadId;
    private Long userId;
    private Long songId;

    // 이벤트 메타데이터
    private LocalDateTime eventTime;
    private String priority;

    /**
     * 벡터 분석 시작 이벤트 생성
     */
    public static VectorAnalysisEvent createAnalysisStartEvent(
            Long recordId, Long uploadId, Long userId, Long songId) {

        return VectorAnalysisEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("VECTOR_ANALYSIS_START")
                .source("wav-conversion-completed")
                .recordId(recordId)
                .uploadId(uploadId)
                .userId(userId)
                .songId(songId)
                .eventTime(LocalDateTime.now())
                .priority("HIGH")
                .build();
    }
}