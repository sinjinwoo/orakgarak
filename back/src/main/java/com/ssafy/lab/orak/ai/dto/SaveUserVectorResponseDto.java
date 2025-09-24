package com.ssafy.lab.orak.ai.dto;

import lombok.Builder;

@Builder
public record SaveUserVectorResponseDto(
        String status,
        String message,
        String vectorId,
        Long userId,
        String uploadId,
        VoiceAnalysisDto voiceAnalysis
) {
}