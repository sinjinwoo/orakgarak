package com.ssafy.lab.orak.album.dto;

import com.ssafy.lab.orak.ai.dto.RecordDataDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;

@Builder
@Schema(description = "AI 앨범 커버 생성 요청")
public record AlbumCoverGenerateRequestDto(
        @Schema(description = "녹음 데이터 리스트", required = true)
        List<RecordDataDto> records,

        @Schema(description = "이미지 비율", example = "1:1", defaultValue = "1:1")
        String aspectRatio,

        @Schema(description = "안전 필터 레벨", example = "block_most", defaultValue = "block_most")
        String safetyFilterLevel,

        @Schema(description = "인물 생성 설정", example = "allow_adult", defaultValue = "allow_adult")
        String personGeneration
) {
    public AlbumCoverGenerateRequestDto(List<RecordDataDto> records) {
        this(records, "1:1", "block_most", "allow_adult");
    }
}