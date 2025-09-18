package com.ssafy.lab.orak.albumtrack.exception;

public class TrackOrderConflictException extends AlbumTrackException {
    
    public TrackOrderConflictException(String message) {
        super(message);
    }
    
    public TrackOrderConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}