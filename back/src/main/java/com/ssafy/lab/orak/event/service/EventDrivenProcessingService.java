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
                
                log.info("이벤트 기반 처리 시작: uploadId: {}", event.getUploadId());
                
                // 업로드 정보 조회
                Upload upload = fileUploadService.getUpload(event.getUploadId());
                
                // 적절한 처리 작업 찾기
                ProcessingJob selectedJob = findApplicableJob(upload);
                
                if (selectedJob == null) {
                    log.warn("업로드에 적용할 수 있는 처리 작업을 찾을 수 없음: {}", upload.getId());
                    publishStatusChangeEvent(event, ProcessingStatus.FAILED, "적용할 수 있는 처리 작업을 찾을 수 없음");
                    return;
                }
                
                // 처리 시작 상태 알림
                publishStatusChangeEvent(event, selectedJob.getProcessingStatus(), "처리 시작됨");
                
                // 실제 처리 수행
                boolean success = selectedJob.process(upload);
                
                if (success) {
                    // 처리 성공
                    ProcessingStatus completedStatus = selectedJob.getCompletedStatus();
                    publishProcessingResult(event, completedStatus, "처리 성공적으로 완료됨");
                    log.info("업로드 처리 성공: {} with job: {}", 
                            upload.getId(), selectedJob.getClass().getSimpleName());
                } else {
                    // 처리 실패
                    String errorMessage = String.format("처리 작업 실패: %s", 
                            selectedJob.getClass().getSimpleName());
                    publishProcessingResult(event, ProcessingStatus.FAILED, errorMessage);
                    log.error("업로드 처리 실패: {} with job: {}", 
                            upload.getId(), selectedJob.getClass().getSimpleName());
                }
                
            } catch (Exception e) {
                log.error("이벤트 기반 처리 중 예상치 못한 오류 발생: uploadId: {}", 
                        event.getUploadId(), e);
                publishProcessingResult(event, ProcessingStatus.FAILED, 
                        "예상치 못한 오류: " + e.getMessage());
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
            log.info("처리 요청 전송 완료: uploadId: {}", uploadEvent.getUploadId());
            
        } catch (Exception e) {
            log.error("처리 요청 실패: uploadId: {}", uploadEvent.getUploadId(), e);
        }
    }

    public void handleStatusChange(UploadEvent event) {
        try {
            log.info("상태 변경 처리 중: uploadId {}: {} -> {}", 
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
            log.error("상태 변경 처리 실패: {}", event, e);
        }
    }

    private void requestNextProcessing(UploadEvent event, ProcessingStatus nextStatus) {
        UploadEvent nextProcessingEvent = UploadEvent.createProcessingRequestEvent(
                event.getUploadId(), event.getUuid(), nextStatus, event.getPriority());
        kafkaEventProducer.sendUploadEvent(nextProcessingEvent);
        log.info("다음 처리 요청됨 ({}) for uploadId: {}", nextStatus, event.getUploadId());
    }

    private void notifyProcessingComplete(UploadEvent event) {
        log.info("모든 처리 완료: uploadId: {}", event.getUploadId());
        // 여기서 외부 시스템 알림, 웹소켓 푸시 등 추가 가능
    }

    private void notifyProcessingFailed(UploadEvent event) {
        log.error("처리 실패: uploadId: {}, error: {}", 
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