package com.ssafy.lab.orak.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "AI 서비스 상태 응답")
public record AiHealthResponseDto(
        @Schema(description = "서비스 상태", example = "ok")
        @JsonProperty("status") String status,

        @Schema(description = "Python 서비스 상태", example = "available")
        @JsonProperty("python_service") String pythonService,

        @Schema(description = "응답 시간", example = "1704067200000")
        @JsonProperty("timestamp") Long timestamp
) {}