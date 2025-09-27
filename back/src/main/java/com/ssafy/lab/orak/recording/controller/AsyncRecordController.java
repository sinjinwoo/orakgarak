package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.CreateRecordRequest;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.service.AsyncRecordService;
import com.ssafy.lab.orak.upload.dto.PresignedUploadRequest;
import com.ssafy.lab.orak.upload.dto.PresignedUploadResponse;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import com.ssafy.lab.orak.upload.service.PresignedUploadService;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 비동기 Recording 컨트롤러
 * - Presigned URL 생성
 * - S3 업로드 완료 웹훅 처리
 * - Record CRUD 엔드포인트
 */
@RestController
@RequestMapping("/records/async")
@RequiredArgsConstructor
@Log4j2
@Validated
public class AsyncRecordController {

    private final AsyncRecordService asyncRecordService;
    private final FileUploadService fileUploadService;
    private final PresignedUploadService presignedUploadService;
    private final S3Helper s3Helper;

    @Value("${orak.eventbridge.webhook.token}")
    private String expectedWebhookToken;

    /**
     * 1단계: Presigned URL 생성 (파일 업로드용)
     * - 제목, songId 등 메타데이터는 별도 API로 처리
     */
    @PostMapping("/presigned-url")
    public ResponseEntity<PresignedUploadResponse> generatePresignedUrl(
            @RequestParam("originalFilename") @NotBlank String originalFilename,
            @RequestParam("fileSize") @Positive Long fileSize,
            @RequestParam("contentType") @NotBlank String contentType,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        // PresignedUploadRequest 생성
        PresignedUploadRequest request = PresignedUploadRequest.builder()
                .originalFilename(originalFilename)
                .fileSize(fileSize)
                .contentType(contentType)
                .directory("recordings")
                .build();

        // 일반적인 파일 업로드 서비스 사용
        PresignedUploadResponse response = presignedUploadService
                .generatePresignedUploadUrl(request, principal.getUserId());

        return ResponseEntity.ok(response);
    }

    /**
     * 2단계: S3 업로드 완료 웹훅 (EventBridge, SQS, 또는 클라이언트에서 호출)
     * 환경별 S3 버킷 분리로 로컬에서는 자동 웹훅 발생하지 않음
     * JSON과 Form-data 요청 모두 지원
     */
    @PostMapping("/upload-completed")
    public ResponseEntity<Map<String, String>> handleUploadCompleted(
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, Object> jsonBody,
            @RequestParam(value = "uploadId", required = false) Long uploadIdParam,
            @RequestParam(value = "s3Key", required = false) String s3KeyParam,
            @RequestParam(value = "source", required = false) String sourceParam,
            @RequestHeader(value = "X-Orak-Event-Source", required = false) String eventSource) {

        // 요청 파라미터 디버깅 로그
        log.info("웹훅 요청 파라미터들:");
        log.info("요청 메서드: {}, Content-Type: {}, Query String: {}",
                request.getMethod(), request.getContentType(), request.getQueryString());

        // Content-Type에 따라 데이터 추출
        Long uploadId;
        String s3Key;
        String source;

        String contentType = request.getContentType();
        if (contentType != null && contentType.contains("application/json") && jsonBody != null) {
            // JSON 요청 처리
            log.info("JSON 웹훅 요청 처리: {}", jsonBody);
            uploadId = jsonBody.get("uploadId") != null ?
                    Long.valueOf(jsonBody.get("uploadId").toString()) : null;
            s3Key = (String) jsonBody.get("s3Key");
            source = (String) jsonBody.get("source");
        } else {
            // Form 데이터 또는 쿼리 파라미터 처리
            log.info("Form/Query 파라미터 웹훅 요청 처리: uploadId={}, s3Key={}, source={}",
                    uploadIdParam, s3KeyParam, sourceParam);
            uploadId = uploadIdParam;
            s3Key = s3KeyParam;
            source = sourceParam;
        }

        // s3Key 필수 체크
        if (s3Key == null || s3Key.trim().isEmpty()) {
            log.warn("s3Key 파라미터가 누락됨. 요청 본문 확인 필요");
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "s3Key 파라미터는 필수입니다"
            ));
        }

        // EventBridge 인증 검증
        if ("eventbridge".equals(source)) {
            if (eventSource == null || !expectedWebhookToken.equals(eventSource)) {
                log.warn("EventBridge 웹훅 인증 실패: source={}, eventSource={}", source, eventSource);
                return ResponseEntity.status(401).body(Map.of(
                        "status", "error",
                        "message", "Unauthorized: Invalid EventBridge token"
                ));
            }
            log.info("EventBridge 웹훅 인증 성공: s3Key={}", s3Key);
        }

        // EventBridge나 SQS에서 온 경우 s3Key로 uploadId 찾기
        if (uploadId == null && ("eventbridge".equals(source) || "sqs".equals(source))) {
            String uuid = s3Helper.extractUuidFromS3Key(s3Key);
            if (uuid != null) {
                Upload upload = fileUploadService.findByUuid(uuid);
                if (upload != null) {
                    uploadId = upload.getId();
                    log.info("EventBridge/SQS 이벤트: s3Key={}, uuid={}, uploadId={}", s3Key, uuid, uploadId);
                } else {
                    log.warn("UUID에 해당하는 업로드 레코드 없음: uuid={}", uuid);
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "업로드 레코드를 찾을 수 없습니다: " + uuid
                    ));
                }
            } else {
                log.warn("S3 키에서 UUID 추출 실패: s3Key={}", s3Key);
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "S3 키 형식이 올바르지 않습니다: " + s3Key
                ));
            }
        }

        // uploadId가 여전히 null인 경우
        if (uploadId == null) {
            log.error("uploadId를 결정할 수 없습니다: s3Key={}, source={}", s3Key, source);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "uploadId 파라미터가 필요합니다"
            ));
        }

        try {
            asyncRecordService.handleS3UploadCompleted(uploadId, s3Key);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "업로드 완료 처리됨",
                    "uploadId", uploadId.toString(),
                    "source", source != null ? source : "client"
            ));
        } catch (Exception e) {
            log.error("업로드 완료 처리 실패: uploadId={}, s3Key={}", uploadId, s3Key, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "업로드 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 2-1단계: 클라이언트 테스트용 간단한 업로드 완료 API
     * - uploadId만으로 간단하게 테스트 가능
     * - 개발/테스트 환경에서 사용
     */
    @PostMapping("/upload-completed/test")
    public ResponseEntity<Map<String, String>> testUploadCompleted(
            @RequestParam("uploadId") @Positive Long uploadId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        log.info("테스트용 업로드 완료 호출: uploadId={}, userId={}", uploadId, principal.getUserId());

        try {
            // 업로드 정보 조회하여 s3Key 생성
            Upload upload = fileUploadService.getUpload(uploadId);
            if (upload == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "업로드 정보를 찾을 수 없습니다: " + uploadId
                ));
            }

            // 권한 확인
            if (!upload.getUploaderId().equals(principal.getUserId())) {
                return ResponseEntity.status(403).body(Map.of(
                        "status", "error",
                        "message", "업로드에 대한 권한이 없습니다"
                ));
            }

            // S3 키 구성 (실제 S3 키 형식에 맞춰 생성)
            String s3Key = String.format("recordings/%s/%s", upload.getUuid(), upload.getOriginalFilename());

            // 업로드 완료 처리
            asyncRecordService.handleS3UploadCompleted(uploadId, s3Key);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "테스트용 업로드 완료 처리됨",
                    "uploadId", uploadId.toString(),
                    "s3Key", s3Key,
                    "source", "client-test"
            ));

        } catch (Exception e) {
            log.error("테스트용 업로드 완료 처리 실패: uploadId={}", uploadId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "업로드 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 3단계: Record 생성 (메타데이터 저장)
     * - S3 업로드 완료 후 호출
     * - 즉시 처리 시도 + 실패 시 비동기 처리
     */
    @PostMapping("")
    public ResponseEntity<RecordResponseDTO> createRecord(
            @RequestBody @jakarta.validation.Valid CreateRecordRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        log.info("Record 생성 요청: uploadId={}, title={}, userId={}",
                request.getUploadId(), request.getTitle(), principal.getUserId());

        try {
            RecordResponseDTO response = asyncRecordService.createRecord(request, principal.getUserId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Record 생성 실패: uploadId={}, title={}",
                    request.getUploadId(), request.getTitle(), e);
            throw e;
        }
    }

    /**
     * Record 조회 (기존과 동일)
     */
    @GetMapping("/{recordId}")
    public ResponseEntity<RecordResponseDTO> getRecord(@PathVariable Long recordId) {
        RecordResponseDTO response = asyncRecordService.getRecord(recordId);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 Record 목록 조회
     */
    @GetMapping("/me")
    public ResponseEntity<List<RecordResponseDTO>> getMyRecords(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        List<RecordResponseDTO> response = asyncRecordService.getRecordsByUser(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * Record 삭제
     */
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(
            @PathVariable Long recordId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        asyncRecordService.deleteRecord(recordId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

}