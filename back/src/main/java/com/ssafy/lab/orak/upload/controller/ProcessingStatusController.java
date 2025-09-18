package com.ssafy.lab.orak.upload.controller;

import com.ssafy.lab.orak.upload.dto.ProcessingStatusResponseDTO;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/processing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Processing Status", description = "파일 처리 상태 관리 API")
public class ProcessingStatusController {
    
    private final FileUploadService fileUploadService;
    
//    특정 파일의 처리 상태 조회
    @GetMapping("/status/{uploadId}")
    @Operation(summary = "파일 처리 상태 조회", description = "특정 업로드 파일의 처리 상태를 조회합니다.")
    public ResponseEntity<ProcessingStatusResponseDTO> getProcessingStatus(
            @PathVariable @Parameter(description = "업로드 ID") Long uploadId) {
        
        log.info("GET /api/processing/status/{} - Processing status inquiry", uploadId);
        
        Upload upload = fileUploadService.getUpload(uploadId);
        ProcessingStatusResponseDTO response = ProcessingStatusResponseDTO.from(upload);
        
        return ResponseEntity.ok(response);
    }
    
//    사용자의 처리 중인 파일 목록 조회
    @GetMapping("/my-files")
    @Operation(summary = "내 파일 처리 상태 목록", description = "현재 사용자의 파일 처리 상태 목록을 조회합니다.")
    public ResponseEntity<List<ProcessingStatusResponseDTO>> getMyProcessingFiles(
            @RequestHeader("User-Id") @Parameter(description = "사용자 ID") Long userId,
            @RequestParam(value = "status", required = false) @Parameter(description = "처리 상태 필터") ProcessingStatus status) {
        
        log.info("GET /api/processing/my-files - User: {}, Status filter: {}", userId, status);
        
        List<Upload> uploads;
        if (status != null) {
            uploads = fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, status);
        } else {
            // 모든 처리 중인 파일 조회 (완료/실패 제외)
            uploads = fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, ProcessingStatus.PROCESSING);
            uploads.addAll(fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, ProcessingStatus.CONVERTING));
            uploads.addAll(fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, ProcessingStatus.ANALYSIS_PENDING));
        }
        
        List<ProcessingStatusResponseDTO> response = uploads.stream()
                .map(ProcessingStatusResponseDTO::from)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
//    처리 상태 업데이트 (내부 API - 프로세싱 서버용)
    @PutMapping("/status/{uploadId}")
    @Operation(summary = "처리 상태 업데이트", description = "파일의 처리 상태를 업데이트합니다. (내부 API)")
    public ResponseEntity<Void> updateProcessingStatus(
            @PathVariable @Parameter(description = "업로드 ID") Long uploadId,
            @RequestParam @Parameter(description = "새로운 처리 상태") ProcessingStatus status,
            @RequestParam(value = "errorMessage", required = false) @Parameter(description = "에러 메시지") String errorMessage) {
        
        log.info("PUT /api/processing/status/{} - Status update: {} ({})", uploadId, status, errorMessage);
        
        if (status == ProcessingStatus.FAILED && errorMessage != null) {
            fileUploadService.markProcessingFailed(uploadId, errorMessage);
        } else {
            fileUploadService.updateProcessingStatus(uploadId, status);
        }
        
        return ResponseEntity.ok().build();
    }
    
//    처리 대기 중인 파일 조회 (배치 프로세서용)
    @GetMapping("/pending")
    @Operation(summary = "처리 대기 파일 조회", description = "처리 대기 중인 오디오 파일 목록을 조회합니다. (배치 처리용)")
    public ResponseEntity<List<ProcessingStatusResponseDTO>> getPendingFiles(
            @RequestParam(value = "limit", defaultValue = "10") @Parameter(description = "조회 개수") int limit) {
        
        log.info("GET /api/processing/pending - Limit: {}", limit);
        
        List<Upload> pendingUploads = fileUploadService.getPendingAudioProcessing(limit);
        List<ProcessingStatusResponseDTO> response = pendingUploads.stream()
                .map(ProcessingStatusResponseDTO::from)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
//    처리 통계 조회 (모니터링용)
    @GetMapping("/stats")
    @Operation(summary = "처리 통계 조회", description = "파일 처리 통계를 조회합니다.")
    public ResponseEntity<ProcessingStatsDTO> getProcessingStats() {
        
        log.info("GET /api/processing/stats - Processing statistics inquiry");
        
        long processingCount = fileUploadService.getUploadRepository().countProcessingFiles();
        long failedCount = fileUploadService.getUploadRepository().countByProcessingStatus(ProcessingStatus.FAILED);
        long completedCount = fileUploadService.getUploadRepository().countByProcessingStatus(ProcessingStatus.COMPLETED);
        
        ProcessingStatsDTO stats = ProcessingStatsDTO.builder()
                .processingCount(processingCount)
                .failedCount(failedCount)
                .completedCount(completedCount)
                .build();
        
        return ResponseEntity.ok(stats);
    }
    
    // 처리 통계 DTO (내부 클래스)
    @lombok.Builder
    @lombok.Getter
    public static class ProcessingStatsDTO {
        private long processingCount;
        private long failedCount;
        private long completedCount;
    }
}