package com.ssafy.lab.orak.event.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class KafkaSendException extends BaseException {
    public KafkaSendException(String customMessage, Throwable cause) {
        super(ErrorCode.KAFKA_SEND_FAILED, customMessage, cause);
    }
}