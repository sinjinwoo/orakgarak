package com.ssafy.lab.orak.upload.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresignedUploadRequest {
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String directory;
}