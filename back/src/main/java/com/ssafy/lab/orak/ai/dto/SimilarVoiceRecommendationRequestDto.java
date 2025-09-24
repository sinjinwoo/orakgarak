package com.ssafy.lab.orak.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

@Builder
public record SimilarVoiceRecommendationRequestDto(
        @NotNull(message = "업로드 ID는 필수입니다.")
        Long uploadId,

        @Positive(message = "추천 곡 수는 1 이상이어야 합니다.")
        Integer topN
) {
    public SimilarVoiceRecommendationRequestDto {
        if (topN == null) {
            topN = 5; // 기본값
        }
    }
}