package com.ssafy.lab.orak.recording.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class AudioConversionException extends BaseException {
    public AudioConversionException(String customMessage, Throwable cause) {
        super(ErrorCode.AUDIO_CONVERSION_FAILED, customMessage, cause);
    }
}