package com.ssafy.lab.orak.common.exception;

import com.ssafy.lab.orak.albumtrack.exception.AlbumTrackException;
import com.ssafy.lab.orak.albumtrack.exception.TrackOrderConflictException;
import com.ssafy.lab.orak.auth.exception.InvalidRefreshTokenException;
import com.ssafy.lab.orak.auth.exception.MissingRefreshTokenException;
import com.ssafy.lab.orak.auth.exception.UserNotFoundException;
import com.ssafy.lab.orak.event.exception.EventBridgeSendException;
import com.ssafy.lab.orak.event.exception.EventProcessingException;
import com.ssafy.lab.orak.event.exception.KafkaSendException;
import com.ssafy.lab.orak.processing.exception.AudioProcessingException;
import com.ssafy.lab.orak.processing.exception.BatchProcessingException;
import com.ssafy.lab.orak.recording.exception.AudioConversionException;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.s3.exception.PresignedUrlException;
import com.ssafy.lab.orak.s3.exception.S3DeleteException;
import com.ssafy.lab.orak.s3.exception.S3UploadException;
import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.exception.InvalidFileException;
import com.ssafy.lab.orak.upload.exception.UploadNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;
import java.util.stream.Collectors;
import jakarta.validation.ConstraintViolation;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MissingServletRequestParameterException;

@Slf4j
@RestControllerAdvice
public class CustomRestAdvice {

    /**
     * 공통 베이스 예외 처리 (새로운 구조)
     */
    @ExceptionHandler(BaseException.class)
    protected ResponseEntity<ErrorResponse> handleBaseException(
            BaseException e, HttpServletRequest request) {

        log.error("기본 예외 발생: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            e.getErrorCode(),
            e.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(errorResponse);
    }

    /**
     * Bean Validation 예외 처리 (@Valid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException e, HttpServletRequest request) {

        log.error("유효성 검증 오류 발생: {}", e.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> ErrorResponse.FieldError.builder()
                        .field(error.getField())
                        .value(error.getRejectedValue() != null ? error.getRejectedValue().toString() : "")
                        .reason(error.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_REQUEST,
            request.getRequestURI(),
            fieldErrors
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 파일 업로드 크기 초과 예외 처리
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    protected ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException e, HttpServletRequest request) {

        log.error("파일 크기 초과 오류 발생: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.FILE_SIZE_EXCEEDED,
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    // ======== 도메인별 예외 처리 (ErrorResponse 사용) ========

    /**
     * Album Track 관련 예외 처리
     */
    @ExceptionHandler(AlbumTrackException.class)
    protected ResponseEntity<ErrorResponse> handleAlbumTrackException(
            AlbumTrackException e, HttpServletRequest request) {

        log.error("앨범 트랙 오류: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.TRACK_OPERATION_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(TrackOrderConflictException.class)
    protected ResponseEntity<ErrorResponse> handleTrackOrderConflictException(
            TrackOrderConflictException e, HttpServletRequest request) {

        log.warn("트랙 순서 충돌: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.TRACK_ORDER_CONFLICT,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * Record 관련 예외 처리
     */
    @ExceptionHandler(RecordNotFoundException.class)
    protected ResponseEntity<ErrorResponse> handleRecordNotFoundException(
            RecordNotFoundException e, HttpServletRequest request) {

        log.error("녹음 파일을 찾을 수 없음: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.RECORD_NOT_FOUND,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(RecordPermissionDeniedException.class)
    protected ResponseEntity<ErrorResponse> handleRecordPermissionDeniedException(
            RecordPermissionDeniedException e, HttpServletRequest request) {

        log.warn("Record permission denied: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.RECORD_PERMISSION_DENIED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(RecordOperationException.class)
    protected ResponseEntity<ErrorResponse> handleRecordOperationException(
            RecordOperationException e, HttpServletRequest request) {

        log.error("녹음 작업 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.RECORD_OPERATION_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Upload 관련 예외 처리
     */
    @ExceptionHandler(UploadNotFoundException.class)
    protected ResponseEntity<ErrorResponse> handleUploadNotFoundException(
            UploadNotFoundException e, HttpServletRequest request) {

        log.error("업로드 파일을 찾을 수 없음: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.UPLOAD_NOT_FOUND,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(FileUploadException.class)
    protected ResponseEntity<ErrorResponse> handleFileUploadException(
            FileUploadException e, HttpServletRequest request) {

        log.error("파일 업로드 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.FILE_UPLOAD_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(InvalidFileException.class)
    protected ResponseEntity<ErrorResponse> handleInvalidFileException(
            InvalidFileException e, HttpServletRequest request) {

        log.warn("Invalid file error: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_FILE_TYPE,
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * S3 관련 예외 처리
     */
    @ExceptionHandler(S3UploadException.class)
    protected ResponseEntity<ErrorResponse> handleS3UploadException(
            S3UploadException e, HttpServletRequest request) {

        log.error("S3 업로드 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.S3_UPLOAD_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(S3DeleteException.class)
    protected ResponseEntity<ErrorResponse> handleS3DeleteException(
            S3DeleteException e, HttpServletRequest request) {

        log.error("S3 삭제 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.S3_DELETE_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(PresignedUrlException.class)
    protected ResponseEntity<ErrorResponse> handlePresignedUrlException(
            PresignedUrlException e, HttpServletRequest request) {

        log.error("Presigned URL 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.PRESIGNED_URL_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(S3UrlGenerationException.class)
    protected ResponseEntity<ErrorResponse> handleS3UrlGenerationException(
            S3UrlGenerationException e, HttpServletRequest request) {

        log.error("S3 URL 생성 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.S3_URL_GENERATION_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * 오디오 처리 관련 예외 처리
     */
    @ExceptionHandler(AudioConversionException.class)
    protected ResponseEntity<ErrorResponse> handleAudioConversionException(
            AudioConversionException e, HttpServletRequest request) {

        log.error("오디오 변환 오류: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.AUDIO_CONVERSION_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * 인증 관련 예외 처리
     */
    @ExceptionHandler(InvalidRefreshTokenException.class)
    protected ResponseEntity<ErrorResponse> handleInvalidRefreshTokenException(
            InvalidRefreshTokenException e, HttpServletRequest request) {

        log.warn("Invalid refresh token: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_REFRESH_TOKEN,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(MissingRefreshTokenException.class)
    protected ResponseEntity<ErrorResponse> handleMissingRefreshTokenException(
            MissingRefreshTokenException e, HttpServletRequest request) {

        log.warn("Missing refresh token: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.MISSING_REFRESH_TOKEN,
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(UserNotFoundException.class)
    protected ResponseEntity<ErrorResponse> handleUserNotFoundException(
            UserNotFoundException e, HttpServletRequest request) {

        log.error("사용자를 찾을 수 없음: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.USER_NOT_FOUND,
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * 제약 조건 위반 예외 처리 (개선된 버전)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    protected ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException e, HttpServletRequest request) {

        log.error("제약 조건 위반 발생: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_REQUEST,
            e.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 누락된 요청 파라미터 예외 처리
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    protected ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(
            MissingServletRequestParameterException e, HttpServletRequest request) {

        log.warn("Missing required parameter: {}", e.getParameterName());

        String message = String.format("필수 요청 파라미터가 누락되었습니다: %s", e.getParameterName());
        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_REQUEST,
            message,
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 잘못된 인수 예외 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    protected ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException e, HttpServletRequest request) {

        log.warn("Invalid argument: {}", e.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INVALID_REQUEST,
            e.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 런타임 예외 처리
     */
    @ExceptionHandler(RuntimeException.class)
    protected ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException e, HttpServletRequest request) {

        log.error("런타임 오류 발생: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    /**
     * 이벤트 처리 예외 처리
     */
    @ExceptionHandler(EventProcessingException.class)
    protected ResponseEntity<ErrorResponse> handleEventProcessingException(
            EventProcessingException e, HttpServletRequest request) {

        log.error("이벤트 처리 실패: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.EVENT_PROCESSING_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    @ExceptionHandler(EventBridgeSendException.class)
    protected ResponseEntity<ErrorResponse> handleEventBridgeSendException(
            EventBridgeSendException e, HttpServletRequest request) {

        log.error("EventBridge 전송 실패: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.EVENTBRIDGE_SEND_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    @ExceptionHandler(KafkaSendException.class)
    protected ResponseEntity<ErrorResponse> handleKafkaSendException(
            KafkaSendException e, HttpServletRequest request) {

        log.error("Kafka 전송 실패: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.KAFKA_SEND_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    /**
     * 처리 관련 예외 처리
     */
    @ExceptionHandler(BatchProcessingException.class)
    protected ResponseEntity<ErrorResponse> handleBatchProcessingException(
            BatchProcessingException e, HttpServletRequest request) {

        log.error("배치 처리 실패: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.BATCH_PROCESSING_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    @ExceptionHandler(AudioProcessingException.class)
    protected ResponseEntity<ErrorResponse> handleAudioProcessingException(
            AudioProcessingException e, HttpServletRequest request) {

        log.error("오디오 처리 실패: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.AUDIO_PROCESSING_FAILED,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }

    /**
     * 모든 기타 예외 처리 (최종 캐치)
     */
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleGenericException(
            Exception e, HttpServletRequest request) {

        log.error("예상치 못한 오류 발생: {}", e.getMessage(), e);

        ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            request.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(errorResponse);
    }
}
