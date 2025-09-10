package com.ssafy.lab.orak.upload.exception;

public class UploadNotFoundException extends RuntimeException {
    
    public UploadNotFoundException(String message) {
        super(message);
    }
    
    public UploadNotFoundException(Long uploadId) {
        super("업로드 파일을 찾을 수 없습니다: " + uploadId);
    }
}