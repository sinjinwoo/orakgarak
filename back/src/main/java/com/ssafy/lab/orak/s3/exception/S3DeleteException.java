package com.ssafy.lab.orak.s3.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class S3DeleteException extends BaseException {
    
    public S3DeleteException() {
        super(ErrorCode.S3_DELETE_FAILED);
    }
    
    public S3DeleteException(String customMessage) {
        super(ErrorCode.S3_DELETE_FAILED, customMessage);
    }

    public S3DeleteException(String customMessage, Throwable cause) {
        super(ErrorCode.S3_DELETE_FAILED, customMessage, cause);
    }
    
    public S3DeleteException(Throwable cause) {
        super(ErrorCode.S3_DELETE_FAILED, cause);
    }
}