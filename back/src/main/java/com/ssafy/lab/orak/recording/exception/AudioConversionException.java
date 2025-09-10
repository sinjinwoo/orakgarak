package com.ssafy.lab.orak.recording.exception;

public class AudioConversionException extends RuntimeException {
    
    public AudioConversionException(String message) {
        super(message);
    }
    
    public AudioConversionException(String message, Throwable cause) {
        super(message, cause);
    }
}