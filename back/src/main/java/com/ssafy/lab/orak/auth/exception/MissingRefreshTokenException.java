package com.ssafy.lab.orak.auth.exception;

public class MissingRefreshTokenException extends RuntimeException {

    public MissingRefreshTokenException(String message) {
        super(message);
    }

    public MissingRefreshTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}