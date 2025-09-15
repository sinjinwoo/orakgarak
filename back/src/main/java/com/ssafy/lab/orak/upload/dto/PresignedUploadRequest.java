package com.ssafy.lab.orak.upload.dto;

import lombok.Data;

@Data
public class PresignedUploadRequest {
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String directory;
}