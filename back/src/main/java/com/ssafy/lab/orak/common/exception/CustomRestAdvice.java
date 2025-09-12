package com.ssafy.lab.orak.common.exception;

import com.ssafy.lab.orak.auth.exception.InvalidRefreshTokenException;
import com.ssafy.lab.orak.auth.exception.MissingRefreshTokenException;
import com.ssafy.lab.orak.auth.exception.UserNotFoundException;
import com.ssafy.lab.orak.recording.exception.AudioConversionException;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.s3.exception.InvalidFileNameException;
import com.ssafy.lab.orak.s3.exception.PresignedUrlException;
import com.ssafy.lab.orak.s3.exception.S3DeleteException;
import com.ssafy.lab.orak.s3.exception.S3UploadException;
import com.ssafy.lab.orak.s3.exception.ThumbnailCreationException;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.exception.InvalidFileException;
import com.ssafy.lab.orak.upload.exception.UploadNotFoundException;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Log4j2
public class CustomRestAdvice {
    
    @ExceptionHandler(RecordNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleRecordNotFoundException(RecordNotFoundException e) {
        log.error("Record not found: {}", e.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, "RECORD_NOT_FOUND", e.getMessage());
    }
    
    @ExceptionHandler(RecordPermissionDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleRecordPermissionDeniedException(RecordPermissionDeniedException e) {
        log.warn("Record permission denied: {}", e.getMessage());
        return createErrorResponse(HttpStatus.FORBIDDEN, "RECORD_PERMISSION_DENIED", e.getMessage());
    }
    
    @ExceptionHandler(UploadNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUploadNotFoundException(UploadNotFoundException e) {
        log.error("Upload not found: {}", e.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, "UPLOAD_NOT_FOUND", e.getMessage());
    }
    
    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<Map<String, Object>> handleFileUploadException(FileUploadException e) {
        log.error("File upload error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.BAD_REQUEST, "FILE_UPLOAD_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidFileException(InvalidFileException e) {
        log.warn("Invalid file error: {}", e.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_FILE_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(AudioConversionException.class)
    public ResponseEntity<Map<String, Object>> handleAudioConversionException(AudioConversionException e) {
        log.error("Audio conversion error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "AUDIO_CONVERSION_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(S3UploadException.class)
    public ResponseEntity<Map<String, Object>> handleS3UploadException(S3UploadException e) {
        log.error("S3 upload error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "S3_UPLOAD_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(S3DeleteException.class)
    public ResponseEntity<Map<String, Object>> handleS3DeleteException(S3DeleteException e) {
        log.error("S3 delete error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "S3_DELETE_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(InvalidFileNameException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidFileNameException(InvalidFileNameException e) {
        log.warn("Invalid file name: {}", e.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_FILE_NAME", e.getMessage());
    }
    
    @ExceptionHandler(PresignedUrlException.class)
    public ResponseEntity<Map<String, Object>> handlePresignedUrlException(PresignedUrlException e) {
        log.error("Presigned URL error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "PRESIGNED_URL_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(ThumbnailCreationException.class)
    public ResponseEntity<Map<String, Object>> handleThumbnailCreationException(ThumbnailCreationException e) {
        log.error("Thumbnail creation error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "THUMBNAIL_CREATION_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidRefreshTokenException(InvalidRefreshTokenException e) {
        log.warn("Invalid refresh token: {}", e.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", e.getMessage());
    }
    
    @ExceptionHandler(MissingRefreshTokenException.class)
    public ResponseEntity<Map<String, Object>> handleMissingRefreshTokenException(MissingRefreshTokenException e) {
        log.warn("Missing refresh token: {}", e.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "MISSING_REFRESH_TOKEN", e.getMessage());
    }
    
    @ExceptionHandler(RecordOperationException.class)
    public ResponseEntity<Map<String, Object>> handleRecordOperationException(RecordOperationException e) {
        log.error("Record operation error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "RECORD_OPERATION_ERROR", e.getMessage());
    }
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(UserNotFoundException e) {
        log.error("User not found: {}", e.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", e.getMessage());
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException e) {
        StringBuilder message = new StringBuilder("검증 오류: ");
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            message.append(violation.getMessage()).append("; ");
        }
        log.warn("Validation error: {}", message);
        return createErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message.toString());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        StringBuilder message = new StringBuilder("요청 데이터 검증 오류: ");
        e.getBindingResult().getFieldErrors().forEach(error -> 
            message.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ")
        );
        log.warn("Method argument validation error: {}", message);
        return createErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message.toString());
    }
    
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {
        String message = "필수 요청 파라미터가 누락되었습니다: " + e.getParameterName();
        log.warn("Missing required parameter: {}", e.getParameterName());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", message);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("Invalid argument: {}", e.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT", e.getMessage());
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.error("Runtime error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다");
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "UNEXPECTED_ERROR", "예상치 못한 오류가 발생했습니다");
    }
    
    private ResponseEntity<Map<String, Object>> createErrorResponse(HttpStatus status, String errorCode, String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("errorCode", errorCode);
        errorResponse.put("message", message);
        
        return new ResponseEntity<>(errorResponse, status);
    }
}
