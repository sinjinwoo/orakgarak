package com.ssafy.lab.orak.processing.service;

import com.ssafy.lab.orak.processing.config.ProcessingConfig;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchProcessingService {


    private final FileUploadService fileUploadService;
    private final ProcessingConfig processingConfig;
    private final List<ProcessingJob> processingJobs;
    
    // 동시 처리 제한을 위한 세마포어
    private final Semaphore processingLimiter = new Semaphore(3); // 기본 3개
    private final AtomicInteger activeJobs = new AtomicInteger(0);
    
    @Scheduled(fixedRateString = "#{${processing.batch.cron-expression:60000}}")
    public void processPendingFiles() {
        if (!processingConfig.getBatch().isEnabled()) {
            return;
        }
        
        int currentActive = activeJobs.get();
        int maxConcurrent = processingConfig.getBatch().getMaxConcurrentJobs();
        
        if (currentActive >= maxConcurrent) {
            log.debug("Max concurrent jobs reached: {}/{}", currentActive, maxConcurrent);
            return;
        }
        
        int batchSize = processingConfig.getBatch().getBatchSize();
        int availableSlots = maxConcurrent - currentActive;
        int actualBatchSize = Math.min(batchSize, availableSlots);
        
        log.info("Starting batch processing - Active: {}, Available: {}, Batch size: {}", 
                currentActive, availableSlots, actualBatchSize);
        
        // 처리 대기 중인 파일 조회
        List<Upload> pendingUploads = fileUploadService.getPendingAudioProcessing(actualBatchSize);
        
        if (pendingUploads.isEmpty()) {
            log.debug("No pending files to process");
            return;
        }
        
        log.info("Found {} pending files for processing", pendingUploads.size());
        
        // 각 파일에 대해 비동기 처리 시작
        for (Upload upload : pendingUploads) {
            CompletableFuture.runAsync(() -> processUploadFile(upload));
        }
    }
    
    private void processUploadFile(Upload upload) {
        try {
            processingLimiter.acquire();
            activeJobs.incrementAndGet();
            
            log.info("Started processing upload: {} ({})", upload.getId(), upload.getOriginalFilename());
            
            // 적절한 처리 작업 찾기
            ProcessingJob selectedJob = findApplicableJob(upload);
            
            if (selectedJob == null) {
                log.warn("No applicable processing job found for upload: {}", upload.getId());
                return;
            }
            
            // 처리 시작 상태 업데이트
            fileUploadService.updateProcessingStatus(upload.getId(), selectedJob.getProcessingStatus());
            
            // 실제 처리 수행
            boolean success = selectedJob.process(upload);
            
            if (success) {
                // 처리 성공
                fileUploadService.updateProcessingStatus(upload.getId(), selectedJob.getCompletedStatus());
                log.info("Successfully processed upload: {} with job: {}", 
                        upload.getId(), selectedJob.getClass().getSimpleName());
            } else {
                // 처리 실패
                String errorMessage = String.format("Processing failed with job: %s", 
                        selectedJob.getClass().getSimpleName());
                fileUploadService.markProcessingFailed(upload.getId(), errorMessage);
                log.error("Failed to process upload: {} with job: {}", 
                        upload.getId(), selectedJob.getClass().getSimpleName());
            }
            
        } catch (Exception e) {
            log.error("Unexpected error processing upload: {}", upload.getId(), e);
            fileUploadService.markProcessingFailed(upload.getId(), 
                    "Unexpected error: " + e.getMessage());
        } finally {
            activeJobs.decrementAndGet();
            processingLimiter.release();
        }
    }
    
    private ProcessingJob findApplicableJob(Upload upload) {
        return processingJobs.stream()
                .filter(job -> job.canProcess(upload))
                .min(Comparator.comparing(ProcessingJob::getPriority))
                .orElse(null);
    }
    
    // 통계 조회용 메서드
    public ProcessingStatistics getStatistics() {
        long processingCount = fileUploadService.getUploadRepository().countProcessingFiles();
        long failedCount = fileUploadService.getUploadRepository().countByProcessingStatus(ProcessingStatus.FAILED);
        long completedCount = fileUploadService.getUploadRepository().countByProcessingStatus(ProcessingStatus.COMPLETED);
        
        return ProcessingStatistics.builder()
                .activeJobs(activeJobs.get())
                .maxConcurrentJobs(processingConfig.getBatch().getMaxConcurrentJobs())
                .processingCount(processingCount)
                .failedCount(failedCount)
                .completedCount(completedCount)
                .batchEnabled(processingConfig.getBatch().isEnabled())
                .build();
    }
    
    // 배치 처리 제어 메서드
    public void pauseProcessing() {
        processingConfig.getBatch().setEnabled(false);
        log.info("Batch processing paused");
    }
    
    public void resumeProcessing() {
        processingConfig.getBatch().setEnabled(true);
        log.info("Batch processing resumed");
    }
    
    @lombok.Builder
    @lombok.Getter
    public static class ProcessingStatistics {
        private int activeJobs;
        private int maxConcurrentJobs;
        private long processingCount;
        private long failedCount;
        private long completedCount;
        private boolean batchEnabled;
    }
}