package com.ssafy.lab.orak.upload.exception;

public class FileUploadException extends RuntimeException {
    
    public FileUploadException(String message) {
        super(message);
    }
    
    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}