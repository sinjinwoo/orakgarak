package com.ssafy.lab.orak.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common (1000-1099)
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 1000, "서버 내부 오류가 발생했습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, 1001, "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, 1002, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, 1003, "접근이 거부되었습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, 1004, "요청한 리소스를 찾을 수 없습니다."),

    // Authentication (1100-1199)
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, 1100, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, 1101, "만료된 토큰입니다."),
    MISSING_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, 1102, "리프레시 토큰이 필요합니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, 1103, "유효하지 않은 리프레시 토큰입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, 1104, "사용자를 찾을 수 없습니다."),

    // File Upload (1200-1299)
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1200, "파일 업로드에 실패했습니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, 1201, "지원하지 않는 파일 형식입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, 1202, "파일 크기가 제한을 초과했습니다."),
    UPLOAD_NOT_FOUND(HttpStatus.NOT_FOUND, 1203, "업로드 파일을 찾을 수 없습니다."),
    INVALID_FILE_NAME(HttpStatus.BAD_REQUEST, 1204, "유효하지 않은 파일명입니다."),

    // S3 (1300-1399)
    S3_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1300, "S3 업로드에 실패했습니다."),
    S3_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1301, "S3 파일 삭제에 실패했습니다."),
    S3_URL_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1302, "S3 URL 생성에 실패했습니다."),
    PRESIGNED_URL_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1303, "Presigned URL 생성에 실패했습니다."),
    THUMBNAIL_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1304, "썸네일 생성에 실패했습니다."),

    // Audio Processing (1400-1499)
    AUDIO_CONVERSION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1400, "오디오 변환에 실패했습니다."),
    AUDIO_PROCESSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1401, "오디오 처리에 실패했습니다."),
    UNSUPPORTED_AUDIO_FORMAT(HttpStatus.BAD_REQUEST, 1402, "지원하지 않는 오디오 형식입니다."),

    // Recording (1500-1599)
    RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, 1500, "녹음 파일을 찾을 수 없습니다."),
    RECORD_PERMISSION_DENIED(HttpStatus.FORBIDDEN, 1501, "녹음 파일에 대한 권한이 없습니다."),
    RECORD_OPERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1502, "녹음 작업에 실패했습니다."),

    // Album (1600-1699)
    ALBUM_NOT_FOUND(HttpStatus.NOT_FOUND, 1600, "앨범을 찾을 수 없습니다."),
    ALBUM_ACCESS_DENIED(HttpStatus.FORBIDDEN, 1601, "앨범에 대한 접근이 거부되었습니다."),
    ALBUM_OPERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1602, "앨범 작업에 실패했습니다."),

    // Album Track (1700-1799)
    TRACK_NOT_FOUND(HttpStatus.NOT_FOUND, 1700, "트랙을 찾을 수 없습니다."),
    TRACK_ORDER_CONFLICT(HttpStatus.CONFLICT, 1701, "트랙 순서 충돌이 발생했습니다."),
    TRACK_OPERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1702, "트랙 작업에 실패했습니다."),

    // Event & Processing (1800-1899)
    EVENT_PROCESSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1800, "이벤트 처리에 실패했습니다."),
    KAFKA_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1801, "카프카 메시지 전송에 실패했습니다."),
    EVENTBRIDGE_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1802, "EventBridge 이벤트 전송에 실패했습니다."),
    BATCH_PROCESSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 1803, "배치 처리에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final int code;
    private final String message;
}