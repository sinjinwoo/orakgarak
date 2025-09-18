package com.ssafy.lab.orak.common.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ErrorResponse {

    private final int code;
    private final String message;
    private final LocalDateTime timestamp;
    private final String path;
    private final List<FieldError> fieldErrors;

    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .path(path)
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String customMessage, String path) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(customMessage)
                .timestamp(LocalDateTime.now())
                .path(path)
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String path, List<FieldError> fieldErrors) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .path(path)
                .fieldErrors(fieldErrors)
                .build();
    }

    @Getter
    @Builder
    public static class FieldError {
        private final String field;
        private final String value;
        private final String reason;
    }
}