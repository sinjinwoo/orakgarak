package com.ssafy.lab.orak.processing.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class AudioProcessingException extends BaseException {

    public AudioProcessingException(String customMessage) {
        super(ErrorCode.AUDIO_PROCESSING_FAILED, customMessage);
    }

    public AudioProcessingException(String customMessage, Throwable cause) {
        super(ErrorCode.AUDIO_PROCESSING_FAILED, customMessage, cause);
    }
}