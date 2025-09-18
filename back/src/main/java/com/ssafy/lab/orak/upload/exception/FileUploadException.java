package com.ssafy.lab.orak.upload.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class FileUploadException extends BaseException {
    
    public FileUploadException() {
        super(ErrorCode.FILE_UPLOAD_FAILED);
    }
    
    public FileUploadException(String customMessage) {
        super(ErrorCode.FILE_UPLOAD_FAILED, customMessage);
    }
    
    public FileUploadException(String customMessage, Throwable cause) {
        super(ErrorCode.FILE_UPLOAD_FAILED, customMessage, cause);
    }
    
    public FileUploadException(Throwable cause) {
        super(ErrorCode.FILE_UPLOAD_FAILED, cause);
    }
}