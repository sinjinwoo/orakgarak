package com.ssafy.lab.orak.upload.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProcessingStatus {
    
    // 기본 상태
    PENDING("업로드 대기 중"),
    UPLOADED("업로드 완료"),
    
    // 오디오 파일 처리 상태
    PROCESSING("처리 중"),
    CONVERTING("포맷 변환 중"),
    ANALYZING("음성 분석 중"),
    ANALYSIS_PENDING("분석 대기 중"),

    // 완료/실패 상태
    COMPLETED("포맷 변환 완료"),
    VECTOR_COMPLETED("모든 처리 완료"),
    FAILED("처리 실패"),
    
    // 이미지 처리 (앨범 커버 등)
    IMAGE_OPTIMIZING("이미지 최적화 중"),
    THUMBNAIL_GENERATING("썸네일 생성 중");
    
    private final String description;

    // 처리 완료 여부 확인
    public boolean isCompleted() {
        return this == VECTOR_COMPLETED || this == FAILED;
    }
}