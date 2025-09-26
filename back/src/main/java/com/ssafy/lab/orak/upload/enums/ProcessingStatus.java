package com.ssafy.lab.orak.upload.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProcessingStatus {

    // 기본 상태
    PENDING("업로드 대기 중"),
    UPLOADED("업로드 완료"),

    // WAV 변환 단계
    AUDIO_CONVERTING("음성 변환 중"),
    AUDIO_CONVERTED("음성 변환 완료"),  // 재생 가능!
    AUDIO_CONVERSION_FAILED("음성 변환 실패"),

    // 음성 분석 단계 (백그라운드)
    VOICE_ANALYSIS_PENDING("음성 분석 대기"),
    VOICE_ANALYZING("음성 분석 중"),
    VOICE_ANALYZED("음성 분석 완료"),
    VOICE_ANALYSIS_FAILED("음성 분석 실패"),

    // 이미지 처리 (앨범 커버 등)
    IMAGE_OPTIMIZING("이미지 최적화 중"),
    THUMBNAIL_GENERATING("썸네일 생성 중"),
    IMAGE_OPTIMIZED("이미지 처리 완료"),

    // 최종 상태
    COMPLETED("모든 처리 완료"),
    FAILED("처리 실패"),

    // 레거시 상태 (하위 호환성)
    @Deprecated
    PROCESSING("처리 중"),
    @Deprecated
    CONVERTING("포맷 변환 중"),
    @Deprecated
    ANALYZING("음성 분석 중"),
    @Deprecated
    ANALYSIS_PENDING("분석 대기 중"),
    @Deprecated
    VECTOR_COMPLETED("모든 처리 완료");

    private final String description;

    // 처리 완료 여부 확인
    public boolean isCompleted() {
        return this == COMPLETED || this == FAILED ||
               this == VOICE_ANALYZED || this == VOICE_ANALYSIS_FAILED ||
               this == AUDIO_CONVERSION_FAILED;
    }

    // 재생 가능 여부 확인
    public boolean isPlayable() {
        return this == AUDIO_CONVERTED || this == VOICE_ANALYSIS_PENDING ||
               this == VOICE_ANALYZING || this == VOICE_ANALYZED ||
               this == VOICE_ANALYSIS_FAILED || this == COMPLETED;
    }

    // 음성 분석 관련 상태인지 확인
    public boolean isVoiceAnalysisStatus() {
        return this == VOICE_ANALYSIS_PENDING || this == VOICE_ANALYZING ||
               this == VOICE_ANALYZED || this == VOICE_ANALYSIS_FAILED;
    }

    // 오디오 변환 관련 상태인지 확인
    public boolean isAudioConversionStatus() {
        return this == AUDIO_CONVERTING || this == AUDIO_CONVERTED ||
               this == AUDIO_CONVERSION_FAILED;
    }
}