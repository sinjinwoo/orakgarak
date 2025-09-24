package com.ssafy.lab.orak.recording.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 벡터 분석 상태 enum
 * 파일 재생과는 독립적으로 관리됨 (노래 추천용)
 */
@Getter
@RequiredArgsConstructor
public enum VectorAnalysisStatus {

    // 기본 상태
    PENDING("벡터 분석 대기"),

    // 처리 중
    PROCESSING("벡터 분석 진행 중"),

    // 완료/실패
    COMPLETED("벡터 분석 완료"),
    FAILED("벡터 분석 실패"),

    // 스킵 (필요시)
    SKIPPED("벡터 분석 생략");

    private final String description;

    /**
     * 분석 완료 여부 확인
     */
    public boolean isCompleted() {
        return this == COMPLETED;
    }

    /**
     * 분석 처리 필요 여부 확인
     */
    public boolean needsProcessing() {
        return this == PENDING;
    }

    /**
     * 분석 진행 중인지 확인
     */
    public boolean isProcessing() {
        return this == PROCESSING;
    }

    /**
     * 최종 상태인지 확인 (완료 또는 실패)
     */
    public boolean isFinalStatus() {
        return this == COMPLETED || this == FAILED || this == SKIPPED;
    }
}