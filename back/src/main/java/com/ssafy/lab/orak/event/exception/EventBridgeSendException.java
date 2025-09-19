package com.ssafy.lab.orak.event.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class EventBridgeSendException extends BaseException {

    public EventBridgeSendException(String customMessage) {
        super(ErrorCode.EVENTBRIDGE_SEND_FAILED, customMessage);
    }

    public EventBridgeSendException(String customMessage, Throwable cause) {
        super(ErrorCode.EVENTBRIDGE_SEND_FAILED, customMessage, cause);
    }
}