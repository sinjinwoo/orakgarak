package com.ssafy.lab.orak.s3.exception;

public class ThumbnailCreationException extends RuntimeException {
    public ThumbnailCreationException(String message) {
        super(message);
    }

    public ThumbnailCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}