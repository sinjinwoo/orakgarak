package com.ssafy.lab.orak.ai.dto;

import com.ssafy.lab.orak.song.dto.SongResponseDTO;
import lombok.Builder;

import java.util.List;

@Builder
public record VoiceRecommendationResponseDto(
        String status,
        String message,
        List<SongResponseDTO> recommendations
) {
}