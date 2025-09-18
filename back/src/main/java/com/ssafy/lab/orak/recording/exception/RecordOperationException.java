package com.ssafy.lab.orak.recording.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class RecordOperationException extends BaseException {

    public RecordOperationException(String customMessage, Throwable cause) {
        super(ErrorCode.RECORD_OPERATION_FAILED, customMessage, cause);
    }

}