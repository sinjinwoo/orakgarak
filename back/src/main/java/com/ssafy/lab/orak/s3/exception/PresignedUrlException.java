package com.ssafy.lab.orak.s3.exception;

public class PresignedUrlException extends RuntimeException {
    public PresignedUrlException(String message) {
        super(message);
    }

    public PresignedUrlException(String message, Throwable cause) {
        super(message, cause);
    }
}