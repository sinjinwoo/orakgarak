package com.ssafy.lab.orak.upload.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VoiceAnalysisStatus {

    NOT_STARTED("분석 예정"),
    PENDING("분석 대기"),
    ANALYZING("분석 중"),
    COMPLETED("분석 완료"),
    FAILED("분석 실패"),
    SKIPPED("분석 안함");  // 이미지 파일 등

    private final String description;

    public boolean isCompleted() {
        return this == COMPLETED || this == FAILED || this == SKIPPED;
    }

    public boolean hasResult() {
        return this == COMPLETED;
    }
}