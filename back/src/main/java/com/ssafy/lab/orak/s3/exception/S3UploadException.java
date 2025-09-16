package com.ssafy.lab.orak.s3.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class S3UploadException extends BaseException {
    
    public S3UploadException() {
        super(ErrorCode.S3_UPLOAD_FAILED);
    }
    
    public S3UploadException(String customMessage) {
        super(ErrorCode.S3_UPLOAD_FAILED, customMessage);
    }

    public S3UploadException(String customMessage, Throwable cause) {
        super(ErrorCode.S3_UPLOAD_FAILED, customMessage, cause);
    }
    
    public S3UploadException(Throwable cause) {
        super(ErrorCode.S3_UPLOAD_FAILED, cause);
    }
}