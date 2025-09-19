package com.ssafy.lab.orak.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "녹음 데이터 정보")
public record RecordDataDto(
        @Schema(description = "녹음 ID", example = "1")
        @JsonProperty("id") Integer id,

        @Schema(description = "사용자 ID", example = "1")
        @JsonProperty("userId") Integer userId,

        @Schema(description = "노래 ID", example = "1")
        @JsonProperty("songId") Integer songId,

        @Schema(description = "노래 제목", example = "Spring Day")
        @JsonProperty("title") String title,

        @Schema(description = "재생 시간(초)", example = "180")
        @JsonProperty("durationSeconds") Integer durationSeconds,

        @Schema(description = "파일 확장자", example = "wav")
        @JsonProperty("extension") String extension,

        @Schema(description = "컨텐츠 타입", example = "audio/wav")
        @JsonProperty("content_type") String contentType,

        @Schema(description = "파일 크기", example = "5MB")
        @JsonProperty("file_size") String fileSize,

        @Schema(description = "파일 URL", example = "/path/to/audio.wav")
        @JsonProperty("url") String url,

        @Schema(description = "URL 상태", example = "active")
        @JsonProperty("urlStatus") String urlStatus,

        @Schema(description = "생성일시", example = "2024-01-01T00:00:00")
        @JsonProperty("createdAt") String createdAt,

        @Schema(description = "수정일시", example = "2024-01-01T00:00:00")
        @JsonProperty("updatedAt") String updatedAt,

        @Schema(description = "업로드 ID", example = "1")
        @JsonProperty("uploadId") Integer uploadId
) {}