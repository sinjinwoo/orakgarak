package com.ssafy.lab.orak.s3.exception;

import com.ssafy.lab.orak.common.exception.BaseException;
import com.ssafy.lab.orak.common.exception.ErrorCode;

public class ThumbnailCreationException extends BaseException {
    
    public ThumbnailCreationException() {
        super(ErrorCode.THUMBNAIL_CREATION_FAILED);
    }
    
    public ThumbnailCreationException(String customMessage) {
        super(ErrorCode.THUMBNAIL_CREATION_FAILED, customMessage);
    }

    public ThumbnailCreationException(String customMessage, Throwable cause) {
        super(ErrorCode.THUMBNAIL_CREATION_FAILED, customMessage, cause);
    }
    
    public ThumbnailCreationException(Throwable cause) {
        super(ErrorCode.THUMBNAIL_CREATION_FAILED, cause);
    }
}