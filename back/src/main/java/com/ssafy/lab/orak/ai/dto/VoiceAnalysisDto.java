package com.ssafy.lab.orak.ai.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record VoiceAnalysisDto(
        String summary,
        List<String> desc,
        List<String> allowedGenres
) {
}