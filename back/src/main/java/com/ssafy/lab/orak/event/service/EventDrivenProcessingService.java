package com.ssafy.lab.orak.event.service;

import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventDrivenProcessingService {

    private final FileUploadService fileUploadService;
    private final List<ProcessingJob> processingJobs;
    private final KafkaEventProducer kafkaEventProducer;
    
    // 동시 처리 제한 (설정 가능하게 만들 수 있음)
    private final Semaphore processingLimiter = new Semaphore(5); // 최대 5개 동시 처리
    private final AtomicInteger activeProcessingJobs = new AtomicInteger(0);

    @Async
    public CompletableFuture<Void> processUploadEvent(UploadEvent event) {
        return CompletableFuture.runAsync(() -> {
            try {
                processingLimiter.acquire();
                activeProcessingJobs.incrementAndGet();
                
                log.info("Starting event-driven processing for uploadId: {}", event.getUploadId());
                
                // 업로드 정보 조회
                Upload upload = fileUploadService.getUpload(event.getUploadId());
                
                // 적절한 처리 작업 찾기
                ProcessingJob selectedJob = findApplicableJob(upload);
                
                if (selectedJob == null) {
                    log.warn("No applicable processing job found for upload: {}", upload.getId());
                    publishStatusChangeEvent(event, ProcessingStatus.FAILED, "No applicable processing job found");
                    return;
                }
                
                // 처리 시작 상태 알림
                publishStatusChangeEvent(event, selectedJob.getProcessingStatus(), "Processing started");
                
                // 실제 처리 수행
                boolean success = selectedJob.process(upload);
                
                if (success) {
                    // 처리 성공
                    ProcessingStatus completedStatus = selectedJob.getCompletedStatus();
                    publishProcessingResult(event, completedStatus, "Processing completed successfully");
                    log.info("Successfully processed upload: {} with job: {}", 
                            upload.getId(), selectedJob.getClass().getSimpleName());
                } else {
                    // 처리 실패
                    String errorMessage = String.format("Processing failed with job: %s", 
                            selectedJob.getClass().getSimpleName());
                    publishProcessingResult(event, ProcessingStatus.FAILED, errorMessage);
                    log.error("Failed to process upload: {} with job: {}", 
                            upload.getId(), selectedJob.getClass().getSimpleName());
                }
                
            } catch (Exception e) {
                log.error("Unexpected error during event-driven processing for uploadId: {}", 
                        event.getUploadId(), e);
                publishProcessingResult(event, ProcessingStatus.FAILED, 
                        "Unexpected error: " + e.getMessage());
            } finally {
                activeProcessingJobs.decrementAndGet();
                processingLimiter.release();
            }
        });
    }

    public void requestProcessing(UploadEvent uploadEvent) {
        try {
            // 처리 요청 이벤트 생성 및 발송
            UploadEvent processingRequest = UploadEvent.createProcessingRequestEvent(
                    uploadEvent.getUploadId(), 
                    uploadEvent.getUuid(),
                    ProcessingStatus.PROCESSING,
                    uploadEvent.getPriority()
            );
            
            kafkaEventProducer.sendUploadEvent(processingRequest);
            log.info("Processing request sent for uploadId: {}", uploadEvent.getUploadId());
            
        } catch (Exception e) {
            log.error("Failed to request processing for uploadId: {}", uploadEvent.getUploadId(), e);
        }
    }

    public void handleStatusChange(UploadEvent event) {
        try {
            log.info("Handling status change for uploadId {}: {} -> {}", 
                    event.getUploadId(), event.getPreviousStatus(), event.getCurrentStatus());
            
            // 상태 변경에 따른 후속 처리 로직
            ProcessingStatus currentStatus = event.getCurrentStatus();
            
            switch (currentStatus) {
                case COMPLETED -> {
                    // 모든 처리 완료 후 알림
                    notifyProcessingComplete(event);
                }
                case FAILED -> {
                    // 실패 시 알림
                    notifyProcessingFailed(event);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to handle status change: {}", event, e);
        }
    }

    private void requestNextProcessing(UploadEvent event, ProcessingStatus nextStatus) {
        UploadEvent nextProcessingEvent = UploadEvent.createProcessingRequestEvent(
                event.getUploadId(), event.getUuid(), nextStatus, event.getPriority());
        kafkaEventProducer.sendUploadEvent(nextProcessingEvent);
        log.info("Requested next processing ({}) for uploadId: {}", nextStatus, event.getUploadId());
    }

    private void notifyProcessingComplete(UploadEvent event) {
        log.info("All processing completed for uploadId: {}", event.getUploadId());
        // 여기서 외부 시스템 알림, 웹소켓 푸시 등 추가 가능
    }

    private void notifyProcessingFailed(UploadEvent event) {
        log.error("Processing failed for uploadId: {}, error: {}", 
                event.getUploadId(), event.getErrorMessage());
        // 여기서 에러 알림, 모니터링 시스템 연동 등 추가 가능
    }

    private void publishStatusChangeEvent(UploadEvent originalEvent, ProcessingStatus newStatus, String message) {
        UploadEvent statusEvent = UploadEvent.createStatusChangeEvent(
                originalEvent.getUploadId(),
                originalEvent.getUuid(),
                newStatus,
                originalEvent.getCurrentStatus(),
                message
        );
        kafkaEventProducer.sendProcessingStatusEvent(statusEvent);
    }

    private void publishProcessingResult(UploadEvent originalEvent, ProcessingStatus finalStatus, String message) {
        UploadEvent resultEvent = UploadEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("PROCESSING_COMPLETED")
                .source("processing")
                .uploadId(originalEvent.getUploadId())
                .uuid(originalEvent.getUuid())
                .currentStatus(finalStatus)
                .previousStatus(originalEvent.getCurrentStatus())
                .statusMessage(message)
                .eventTime(java.time.LocalDateTime.now())
                .build();
                
        if (finalStatus == ProcessingStatus.FAILED) {
            resultEvent.setErrorMessage(message);
        }
        
        kafkaEventProducer.sendProcessingResultEvent(resultEvent);
    }

    private ProcessingJob findApplicableJob(Upload upload) {
        return processingJobs.stream()
                .filter(job -> job.canProcess(upload))
                .min(Comparator.comparing(ProcessingJob::getPriority))
                .orElse(null);
    }

    // 통계 조회
    public ProcessingStatistics getProcessingStatistics() {
        return ProcessingStatistics.builder()
                .activeJobs(activeProcessingJobs.get())
                .maxConcurrentJobs(processingLimiter.availablePermits() + activeProcessingJobs.get())
                .availableSlots(processingLimiter.availablePermits())
                .build();
    }

    @lombok.Builder
    @lombok.Data
    public static class ProcessingStatistics {
        private int activeJobs;
        private int maxConcurrentJobs;
        private int availableSlots;
    }
}