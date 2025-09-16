package com.ssafy.lab.orak.upload.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class InvalidFileException extends BaseException {
    
    public InvalidFileException() {
        super(ErrorCode.INVALID_FILE_TYPE);
    }
    
    public InvalidFileException(String customMessage) {
        super(ErrorCode.INVALID_FILE_TYPE, customMessage);
    }
    
    public InvalidFileException(String customMessage, Throwable cause) {
        super(ErrorCode.INVALID_FILE_TYPE, customMessage, cause);
    }
    
    public InvalidFileException(Throwable cause) {
        super(ErrorCode.INVALID_FILE_TYPE, cause);
    }
}