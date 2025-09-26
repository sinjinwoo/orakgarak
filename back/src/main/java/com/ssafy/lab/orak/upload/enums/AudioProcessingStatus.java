package com.ssafy.lab.orak.upload.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AudioProcessingStatus {

    PENDING("변환 대기"),
    CONVERTING("변환 중"),
    COMPLETED("변환 완료"),  // 재생 가능!
    FAILED("변환 실패");

    private final String description;

    public boolean isPlayable() {
        return this == COMPLETED;
    }

    public boolean isCompleted() {
        return this == COMPLETED || this == FAILED;
    }
}