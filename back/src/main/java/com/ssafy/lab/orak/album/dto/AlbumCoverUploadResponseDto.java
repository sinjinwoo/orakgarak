package com.ssafy.lab.orak.album.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "앨범 커버 업로드 응답")
public record AlbumCoverUploadResponseDto(
        @Schema(description = "업로드 ID", example = "1")
        Long uploadId,

        @Schema(description = "S3 Presigned URL", example = "https://bucket.s3.amazonaws.com/album-covers/uuid_filename.jpg?presigned-params")
        String presignedUrl,

        @Schema(description = "S3 파일 키", example = "album-covers/uuid_filename.jpg")
        String s3Key,

        @Schema(description = "원본 파일명", example = "my_album_cover.jpg")
        String originalFileName
) {}