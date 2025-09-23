package com.ssafy.lab.orak.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record SaveUserVectorRequestDto(
        @NotNull(message = "녹음 ID는 필수입니다.")
        Long recordId
) {
}