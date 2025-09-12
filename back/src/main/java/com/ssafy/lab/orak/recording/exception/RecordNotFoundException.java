package com.ssafy.lab.orak.recording.exception;

public class RecordNotFoundException extends RuntimeException {
    
    public RecordNotFoundException(String message) {
        super(message);
    }
    
    public RecordNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public RecordNotFoundException(Long recordId) {
        super("녹음 파일을 찾을 수 없습니다: " + recordId);
    }
}