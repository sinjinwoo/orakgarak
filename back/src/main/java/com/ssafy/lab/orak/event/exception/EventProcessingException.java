package com.ssafy.lab.orak.event.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class EventProcessingException extends BaseException {

    public EventProcessingException(String customMessage, Throwable cause) {
        super(ErrorCode.EVENT_PROCESSING_FAILED, customMessage, cause);
    }
}