package com.ssafy.lab.orak.album.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;

@Builder
@Schema(description = "AI 앨범 커버 생성 요청")
public record AlbumCoverGenerateRequestDto(
        @Schema(description = "업로드 ID 리스트", required = true, example = "[1, 2, 3]")
        List<Long> uploadIds,

        @Schema(description = "이미지 비율", example = "1:1", defaultValue = "1:1")
        String aspectRatio,

        @Schema(description = "안전 필터 레벨", example = "block_most", defaultValue = "block_most")
        String safetyFilterLevel,

        @Schema(description = "인물 생성 설정", example = "allow_adult", defaultValue = "allow_adult")
        String personGeneration
) {
    public AlbumCoverGenerateRequestDto(List<Long> uploadIds) {
        this(uploadIds, "1:1", "block_most", "allow_adult");
    }
}