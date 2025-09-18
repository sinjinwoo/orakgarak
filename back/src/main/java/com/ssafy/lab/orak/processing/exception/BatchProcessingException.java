package com.ssafy.lab.orak.processing.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class BatchProcessingException extends BaseException {

    public BatchProcessingException(String customMessage, Throwable cause) {
        super(ErrorCode.BATCH_PROCESSING_FAILED, customMessage, cause);
    }
}