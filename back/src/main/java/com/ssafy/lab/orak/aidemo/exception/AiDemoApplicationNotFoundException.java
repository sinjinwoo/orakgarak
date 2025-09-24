package com.ssafy.lab.orak.aidemo.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class AiDemoApplicationNotFoundException extends BaseException {

    public AiDemoApplicationNotFoundException(Long applicationId) {
        super(ErrorCode.AI_DEMO_APPLICATION_NOT_FOUND, "AI 데모 신청을 찾을 수 없습니다: " + applicationId);
    }

}