package com.ssafy.lab.orak.ai.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record PineconeMetadataGenerationRequestDto(
        List<String> uploadIds,  // Pinecone에서 사용할 upload ID 문자열
        String aspectRatio,
        String safetyFilterLevel,
        String personGeneration
) {
}