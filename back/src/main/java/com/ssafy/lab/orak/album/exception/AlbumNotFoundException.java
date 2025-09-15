package com.ssafy.lab.orak.album.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AlbumNotFoundException extends RuntimeException {
    
    public AlbumNotFoundException(String message) {
        super(message);
    }
    
    public AlbumNotFoundException(Long albumId) {
        super("앨범을 찾을 수 없습니다. ID: " + albumId);
    }
}