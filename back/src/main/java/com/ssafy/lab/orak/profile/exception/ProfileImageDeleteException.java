package com.ssafy.lab.orak.profile.exception;

public class ProfileImageDeleteException extends RuntimeException {

    public ProfileImageDeleteException(String message) {
        super(message);
    }

    public ProfileImageDeleteException(String message, Throwable cause) {
        super(message, cause);
    }
}