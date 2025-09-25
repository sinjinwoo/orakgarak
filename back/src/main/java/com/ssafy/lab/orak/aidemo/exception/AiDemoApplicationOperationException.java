package com.ssafy.lab.orak.aidemo.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class AiDemoApplicationOperationException extends BaseException {

    public AiDemoApplicationOperationException(String message) {
        super(ErrorCode.AI_DEMO_APPLICATION_OPERATION_FAILED, message);
    }

    public AiDemoApplicationOperationException(String message, Throwable cause) {
        super(ErrorCode.AI_DEMO_APPLICATION_OPERATION_FAILED, message, cause);
    }

}