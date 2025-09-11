package com.ssafy.lab.orak.recording.exception;

public class RecordOperationException extends RuntimeException {
    
    public RecordOperationException(String message) {
        super(message);
    }
    
    public RecordOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}