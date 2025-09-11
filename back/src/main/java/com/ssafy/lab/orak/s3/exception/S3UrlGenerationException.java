package com.ssafy.lab.orak.s3.exception;

public class S3UrlGenerationException extends RuntimeException {
    
    private final String s3Key;
    
    public S3UrlGenerationException(String s3Key, String message) {
        super(message);
        this.s3Key = s3Key;
    }
    
    public S3UrlGenerationException(String s3Key, String message, Throwable cause) {
        super(message, cause);
        this.s3Key = s3Key;
    }
    
    public String getS3Key() {
        return s3Key;
    }
}