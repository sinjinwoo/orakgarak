package com.ssafy.lab.orak.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;

@Builder
@Schema(description = "음성 기반 이미지 생성 요청")
public record VoiceImageGenerationRequestDto(
        @Schema(description = "녹음 데이터 리스트", required = true)
        @JsonProperty("records") List<RecordDataDto> records,

        @Schema(description = "이미지 비율", example = "1:1", defaultValue = "1:1")
        @JsonProperty("aspect_ratio") String aspectRatio,

        @Schema(description = "안전 필터 레벨", example = "block_most", defaultValue = "block_most")
        @JsonProperty("safety_filter_level") String safetyFilterLevel,

        @Schema(description = "인물 생성 설정", example = "allow_adult", defaultValue = "allow_adult")
        @JsonProperty("person_generation") String personGeneration
) {
    public VoiceImageGenerationRequestDto(List<RecordDataDto> records) {
        this(records, "1:1", "block_most", "allow_adult");
    }
}