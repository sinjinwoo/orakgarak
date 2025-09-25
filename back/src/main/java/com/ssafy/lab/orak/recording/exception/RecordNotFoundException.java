package com.ssafy.lab.orak.recording.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class RecordNotFoundException extends BaseException {

    public RecordNotFoundException(Long recordId) {
        super(ErrorCode.RECORD_NOT_FOUND, "녹음 파일을 찾을 수 없습니다: " + recordId);
    }

    public RecordNotFoundException(String message) {
        super(ErrorCode.RECORD_NOT_FOUND, message);
    }

}