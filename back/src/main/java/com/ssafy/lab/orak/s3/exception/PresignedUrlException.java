package com.ssafy.lab.orak.s3.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class PresignedUrlException extends BaseException {
    
    public PresignedUrlException() {
        super(ErrorCode.PRESIGNED_URL_FAILED);
    }
    
    public PresignedUrlException(String customMessage) {
        super(ErrorCode.PRESIGNED_URL_FAILED, customMessage);
    }

    public PresignedUrlException(String customMessage, Throwable cause) {
        super(ErrorCode.PRESIGNED_URL_FAILED, customMessage, cause);
    }
    
    public PresignedUrlException(Throwable cause) {
        super(ErrorCode.PRESIGNED_URL_FAILED, cause);
    }
}