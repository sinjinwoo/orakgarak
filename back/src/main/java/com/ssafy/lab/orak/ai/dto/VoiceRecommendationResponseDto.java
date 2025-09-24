package com.ssafy.lab.orak.ai.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record VoiceRecommendationResponseDto(
        String status,
        String message,
        List<RecommendationSongDto> recommendations,
        VoiceAnalysisDto voiceAnalysis
) {
}