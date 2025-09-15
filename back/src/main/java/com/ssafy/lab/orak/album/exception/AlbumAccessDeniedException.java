package com.ssafy.lab.orak.album.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class AlbumAccessDeniedException extends RuntimeException {
    
    public AlbumAccessDeniedException(String message) {
        super(message);
    }

}