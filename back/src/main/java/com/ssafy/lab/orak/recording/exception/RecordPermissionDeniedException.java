package com.ssafy.lab.orak.recording.exception;

public class RecordPermissionDeniedException extends RuntimeException {
    
    public RecordPermissionDeniedException(String message) {
        super(message);
    }
    
    public RecordPermissionDeniedException() {
        super("녹음 파일에 대한 권한이 없습니다");
    }
    
    public RecordPermissionDeniedException(Long recordId, Long userId) {
        super(String.format("녹음 파일 권한 없음: recordId=%d, userId=%d", recordId, userId));
    }
}