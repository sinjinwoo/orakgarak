package com.ssafy.lab.orak.s3.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class InvalidFileNameException extends BaseException {
    
    public InvalidFileNameException() {
        super(ErrorCode.INVALID_FILE_NAME);
    }
    
    public InvalidFileNameException(String customMessage) {
        super(ErrorCode.INVALID_FILE_NAME, customMessage);
    }

    public InvalidFileNameException(String customMessage, Throwable cause) {
        super(ErrorCode.INVALID_FILE_NAME, customMessage, cause);
    }
    
    public InvalidFileNameException(Throwable cause) {
        super(ErrorCode.INVALID_FILE_NAME, cause);
    }
}