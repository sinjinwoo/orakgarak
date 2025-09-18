package com.ssafy.lab.orak.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;

@Builder
@Schema(description = "음성 기반 이미지 생성 응답")
public record VoiceImageGenerationResponseDto(
        @Schema(description = "성공 여부", example = "true")
        @JsonProperty("success") Boolean success,

        @Schema(description = "생성된 이미지 (Base64)", example = "iVBORw0KGgoAAAANSUhEUgAA...")
        @JsonProperty("image_base64") String imageBase64,

        @Schema(description = "생성에 사용된 프롬프트")
        @JsonProperty("generated_prompt") String generatedPrompt,

        @Schema(description = "음성에서 추출된 키워드", example = "[\"밝은 목소리\", \"경쾌한 톤\"]")
        @JsonProperty("voice_keywords") List<String> voiceKeywords,

        @Schema(description = "노래 제목 리스트", example = "[\"Spring Day\", \"Dynamite\"]")
        @JsonProperty("song_titles") List<String> songTitles,

        @Schema(description = "생성 파라미터")
        @JsonProperty("parameters") Object parameters,

        @Schema(description = "오류 메시지")
        @JsonProperty("error") String error
) {}