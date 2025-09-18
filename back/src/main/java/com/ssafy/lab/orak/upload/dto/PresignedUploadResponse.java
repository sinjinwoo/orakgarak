package com.ssafy.lab.orak.upload.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresignedUploadResponse {
    private Long uploadId;
    private String uuid;
    private String presignedUrl;
    private String s3Key;
    private String originalFilename;
    private String uploadMetadata;
}