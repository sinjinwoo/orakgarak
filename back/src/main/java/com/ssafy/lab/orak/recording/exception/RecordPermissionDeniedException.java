package com.ssafy.lab.orak.recording.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class RecordPermissionDeniedException extends BaseException {

    
    public RecordPermissionDeniedException(Long recordId, Long userId) {
        super(ErrorCode.RECORD_PERMISSION_DENIED, String.format("녹음 파일 권한 없음: recordId=%d, userId=%d", recordId, userId));
    }
}