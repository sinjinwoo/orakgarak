package com.ssafy.lab.orak.aidemo.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class DuplicateAiDemoApplicationException extends BaseException {

    public DuplicateAiDemoApplicationException(Long userId, Long recordId) {
        super(ErrorCode.DUPLICATE_AI_DEMO_APPLICATION,
              "해당 녹음본으로 이미 AI 데모 신청이 존재합니다. userId: " + userId + ", recordId: " + recordId);
    }

}