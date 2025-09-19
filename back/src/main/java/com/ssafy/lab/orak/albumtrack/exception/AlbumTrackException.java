package com.ssafy.lab.orak.albumtrack.exception;

public class AlbumTrackException extends RuntimeException {
    
    public AlbumTrackException(String message) {
        super(message);
    }
    
    public AlbumTrackException(String message, Throwable cause) {
        super(message, cause);
    }
}