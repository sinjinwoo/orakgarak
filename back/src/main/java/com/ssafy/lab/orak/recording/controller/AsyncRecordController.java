package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.service.AsyncRecordService;
import com.ssafy.lab.orak.recording.service.RecordingBatchProcessor;
import com.ssafy.lab.orak.upload.dto.PresignedUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Map;

/**
 * 비동기 Recording 컨트롤러
 * - Presigned URL 생성
 * - 배치 처리 모니터링
 * - 테스트 엔드포인트
 */
@RestController
@RequestMapping("/api/records/async")
@RequiredArgsConstructor
@Slf4j
@Validated
public class AsyncRecordController {

    private final AsyncRecordService asyncRecordService;
    private final RecordingBatchProcessor batchProcessor;

    /**
     * 1단계: Presigned URL 생성 (비동기 업로드용)
     */
    @PostMapping("/presigned-url")
    public ResponseEntity<PresignedUploadResponse> generatePresignedUrl(
            @RequestParam("title") @NotBlank String title,
            @RequestParam(value = "songId", required = false) Long songId,
            @RequestParam("originalFilename") @NotBlank String originalFilename,
            @RequestParam("fileSize") @Positive Long fileSize,
            @RequestParam("contentType") @NotBlank String contentType,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        PresignedUploadResponse response = asyncRecordService.generatePresignedUrlForRecord(
                title, songId, originalFilename, fileSize, contentType, principal.getUserId());

        return ResponseEntity.ok(response);
    }

    /**
     * 2단계: S3 업로드 완료 웹훅 (S3 이벤트 또는 클라이언트에서 호출)
     */
    @PostMapping("/upload-completed")
    public ResponseEntity<Map<String, String>> handleUploadCompleted(
            @RequestParam("uploadId") @NotNull Long uploadId,
            @RequestParam("s3Key") @NotBlank String s3Key) {

        asyncRecordService.handleS3UploadCompleted(uploadId, s3Key);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "업로드 완료 처리됨",
                "uploadId", uploadId.toString()
        ));
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

    // ========== 배치 처리 관리 엔드포인트 ==========

    /**
     * 배치 처리 설정 조회
     */
    @GetMapping("/batch/config")
    public ResponseEntity<RecordingBatchProcessor.BatchConfig> getBatchConfig() {
        return ResponseEntity.ok(batchProcessor.getBatchConfig());
    }

    /**
     * 수동 배치 처리 트리거 (테스트용)
     */
    @PostMapping("/batch/trigger")
    public ResponseEntity<Map<String, String>> triggerBatch() {
        batchProcessor.triggerManualBatch();
        return ResponseEntity.ok(Map.of(
                "status", "triggered",
                "message", "배치 처리가 시작되었습니다"
        ));
    }

    /**
     * 배치 처리 활성화/비활성화
     */
    @PutMapping("/batch/enabled")
    public ResponseEntity<Map<String, Object>> setBatchEnabled(
            @RequestParam("enabled") boolean enabled) {

        batchProcessor.setBatchEnabled(enabled);
        return ResponseEntity.ok(Map.of(
                "status", "updated",
                "batchEnabled", enabled
        ));
    }

    /**
     * 배치 크기 동적 변경 (테스트용)
     */
    @PutMapping("/batch/size")
    public ResponseEntity<Map<String, Object>> setBatchSize(
            @RequestParam("size") @Positive int size) {

        batchProcessor.setBatchSize(size);
        return ResponseEntity.ok(Map.of(
                "status", "updated",
                "batchSize", size
        ));
    }
}