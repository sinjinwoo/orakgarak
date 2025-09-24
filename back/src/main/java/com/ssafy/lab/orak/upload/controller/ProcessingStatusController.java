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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/processing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Processing Status", description = "파일 처리 상태 관리 API")
public class ProcessingStatusController {

    private final FileUploadService fileUploadService;

    // SSE 연결 관리용 맵 (uploadId -> SseEmitter)
    private final Map<Long, SseEmitter> sseEmitters = new ConcurrentHashMap<>();
    
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
            uploads.addAll(fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, ProcessingStatus.ANALYZING));
            uploads.addAll(fileUploadService.getUploadRepository().findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, ProcessingStatus.ANALYSIS_PENDING));
        }
        
        List<ProcessingStatusResponseDTO> response = uploads.stream()
                .map(ProcessingStatusResponseDTO::from)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    // SSE 연결 엔드포인트 - 실시간 상태 업데이트
    @GetMapping("/status/{uploadId}/stream")
    @Operation(summary = "파일 처리 상태 실시간 스트림", description = "SSE를 통해 특정 파일의 처리 상태를 실시간으로 수신합니다.")
    public SseEmitter streamProcessingStatus(@PathVariable @Parameter(description = "업로드 ID") Long uploadId) {

        log.info("[SSE] 파일 처리 상태 스트림 연결 요청 - uploadId: {}", uploadId);

        // 30분 타임아웃 설정
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        // 연결 관리 맵에 추가
        sseEmitters.put(uploadId, emitter);

        // 연결 종료 시 정리
        emitter.onCompletion(() -> {
            log.info("[SSE] 파일 처리 상태 스트림 연결 완료 - uploadId: {}", uploadId);
            sseEmitters.remove(uploadId);
        });

        emitter.onTimeout(() -> {
            log.info("[SSE] 파일 처리 상태 스트림 연결 타임아웃 - uploadId: {}", uploadId);
            sseEmitters.remove(uploadId);
        });

        emitter.onError((ex) -> {
            log.error("[SSE] 파일 처리 상태 스트림 연결 오류 - uploadId: {}", uploadId, ex);
            sseEmitters.remove(uploadId);
        });

        // 즉시 현재 상태 전송
        try {
            Upload upload = fileUploadService.getUpload(uploadId);
            ProcessingStatusResponseDTO currentStatus = ProcessingStatusResponseDTO.from(upload);
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data(currentStatus));
        } catch (IOException e) {
            log.error("[SSE] 초기 상태 전송 실패 - uploadId: {}", uploadId, e);
            sseEmitters.remove(uploadId);
            emitter.completeWithError(e);
        } catch (Exception e) {
            log.error("[SSE] 업로드 정보 조회 실패 - uploadId: {}", uploadId, e);
            sseEmitters.remove(uploadId);
            emitter.completeWithError(e);
        }

        return emitter;
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

        // SSE로 실시간 상태 업데이트 전송
        notifyStatusUpdate(uploadId);

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

    // SSE 상태 업데이트 알림 메서드
    private void notifyStatusUpdate(Long uploadId) {
        SseEmitter emitter = sseEmitters.get(uploadId);
        if (emitter != null) {
            try {
                Upload upload = fileUploadService.getUpload(uploadId);
                ProcessingStatusResponseDTO statusUpdate = ProcessingStatusResponseDTO.from(upload);

                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(statusUpdate));

                log.info("[SSE] 처리 상태 업데이트 전송 완료 - uploadId: {}, 상태: {}", uploadId, statusUpdate.getStatus());

                // 처리 완료 시 연결 종료
                if (upload.getProcessingStatus().isCompleted()) {
                    emitter.complete();
                    sseEmitters.remove(uploadId);
                    log.info("[SSE] 파일 처리 완료로 인한 연결 종료 - uploadId: {}, 최종 상태: {}", uploadId, upload.getProcessingStatus());
                }

            } catch (IOException e) {
                log.error("[SSE] 상태 업데이트 전송 실패 - uploadId: {}", uploadId, e);
                emitter.completeWithError(e);
                sseEmitters.remove(uploadId);
            } catch (Exception e) {
                log.error("[SSE] 상태 업데이트를 위한 업로드 데이터 조회 실패 - uploadId: {}", uploadId, e);
                emitter.completeWithError(e);
                sseEmitters.remove(uploadId);
            }
        }
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