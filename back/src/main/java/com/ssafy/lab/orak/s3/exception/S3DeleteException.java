package com.ssafy.lab.orak.s3.exception;

public class S3DeleteException extends RuntimeException {
    public S3DeleteException(String message) {
        super(message);
    }

    public S3DeleteException(String message, Throwable cause) {
        super(message, cause);
    }
}