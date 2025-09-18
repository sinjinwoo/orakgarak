package com.ssafy.lab.orak.processing.service;

import com.ssafy.lab.orak.processing.config.ProcessingConfig;
import com.ssafy.lab.orak.processing.exception.BatchProcessingException;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

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
    private final Timer processingDurationTimer;
    private final AtomicLong processingQueueSize;
    private final RecordRepository recordRepository;
    
    // 동시 처리 제한을 위한 세마포어
    private final Semaphore processingLimiter = new Semaphore(3); // 기본 3개
    private final AtomicInteger activeJobs = new AtomicInteger(0);
    
    @Scheduled(fixedRateString = "#{${processing.batch.interval-ms:60000}}")
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
        
        log.info("배치 처리 시작 - 활성: {}, 가용: {}, 배치 크기: {}", 
                currentActive, availableSlots, actualBatchSize);
        
        // 처리 대기 중인 파일 조회 (재시도 가능한 파일 포함)
        List<Upload> pendingUploads = fileUploadService.getPendingAudioProcessingWithRetry(
                actualBatchSize,
                processingConfig.getBatch().getRetryAttempts(),
                processingConfig.getBatch().getRetryDelayMs()
        );

        // 큐 크기 업데이트
        processingQueueSize.set(pendingUploads.size());

        if (pendingUploads.isEmpty()) {
            log.debug("처리할 대기 파일이 없습니다");
            return;
        }

        log.info("처리 대기 중인 파일 {}개 발견", pendingUploads.size());
        
        // 각 파일에 대해 비동기 처리 시작
        for (Upload upload : pendingUploads) {
            CompletableFuture.runAsync(() -> processUploadFile(upload));
        }
    }
    
    private void processUploadFile(Upload upload) {
        Timer.Sample sample = Timer.start();
        try {
            processingLimiter.acquire();
            activeJobs.incrementAndGet();

            log.info("업로드 처리 시작: {} ({})", upload.getId(), upload.getOriginalFilename());

            // Recording 파일인 경우 Record 존재 확인
            if (isRecordingUpload(upload)) {
                Record record = recordRepository.findByUploadId(upload.getId());
                if (record == null) {
                    log.info("Record가 아직 생성되지 않음, 다음 배치에서 재시도: uploadId={}", upload.getId());
                    return; // 스킵하고 다음 배치에서 재시도
                }
                log.info("Record 확인 완료: uploadId={}, recordId={}, title={}",
                        upload.getId(), record.getId(), record.getTitle());
            }

            // 적절한 처리 작업 찾기
            ProcessingJob selectedJob = findApplicableJob(upload);
            
            if (selectedJob == null) {
                log.warn("업로드에 적용 가능한 처리 작업을 찾을 수 없음: {}", upload.getId());
                return;
            }
            
            // 처리 시작 상태 업데이트
            fileUploadService.updateProcessingStatus(upload.getId(), selectedJob.getProcessingStatus());
            
            // 실제 처리 수행
            boolean success = selectedJob.process(upload);
            
            if (success) {
                // 처리 성공 - 재시도 카운터 리셋
                upload.resetRetryCount();
                fileUploadService.updateProcessingStatus(upload.getId(), selectedJob.getCompletedStatus());
                log.info("업로드 처리 성공: {} (작업: {})",
                        upload.getId(), selectedJob.getClass().getSimpleName());
            } else {
                // 처리 실패 - 재시도 또는 최종 실패 처리
                handleProcessingFailure(upload, selectedJob,
                        String.format("작업 처리 실패: %s", selectedJob.getClass().getSimpleName()));
            }
            
        } catch (BatchProcessingException e) {
            log.error("배치 처리 실패: uploadId={}", upload.getId(), e);
            fileUploadService.markProcessingFailed(upload.getId(), 
                    "배치 처리 실패: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("배치 처리 중 예상치 못한 오류 발생: uploadId={}", upload.getId(), e);
            fileUploadService.markProcessingFailed(upload.getId(), 
                    "배치 처리 중 예상치 못한 오류: " + e.getMessage());
            throw new BatchProcessingException("배치 처리 중 예상치 못한 오류가 발생했습니다", e);
        } finally {
            sample.stop(processingDurationTimer);
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

    /**
     * 처리 실패 시 재시도 또는 최종 실패 처리
     */
    private void handleProcessingFailure(Upload upload, ProcessingJob job, String errorMessage) {
        int maxRetries = processingConfig.getBatch().getRetryAttempts();

        if (upload.isMaxRetryExceeded(maxRetries)) {
            // 최대 재시도 횟수 초과 - Dead Letter Queue로 이동
            moveToDeadLetterQueue(upload, errorMessage);
            log.error("최대 재시도 횟수 초과로 DLQ 이동: uploadId={}, retryCount={}, maxRetries={}",
                    upload.getId(), upload.getRetryCount(), maxRetries);
        } else {
            // 재시도 가능 - PENDING 상태로 설정하여 다음 배치에서 재처리
            upload.markRetryableFailure(errorMessage);
            fileUploadService.save(upload);

            log.warn("처리 실패로 재시도 예약: uploadId={}, retryCount={}/{}, nextRetryAfter={}초",
                    upload.getId(), upload.getRetryCount(), maxRetries,
                    processingConfig.getBatch().getRetryDelayMs() / 1000);
        }
    }

    /**
     * Dead Letter Queue로 파일 이동
     */
    private void moveToDeadLetterQueue(Upload upload, String finalErrorMessage) {
        // ProcessingStatus에 DEAD_LETTER_QUEUE 상태 추가 필요
        upload.markProcessingFailed("DLQ: " + finalErrorMessage +
                " (재시도 " + upload.getRetryCount() + "회 실패)");
        fileUploadService.save(upload);

        // 추후 별도 DLQ 테이블이나 외부 시스템으로 이동할 수 있음
        log.error("파일을 Dead Letter Queue로 이동: uploadId={}, originalFilename={}, finalError={}",
                upload.getId(), upload.getOriginalFilename(), finalErrorMessage);
    }

    /**
     * Recording 디렉토리의 Upload인지 확인
     */
    private boolean isRecordingUpload(Upload upload) {
        return "recordings".equals(upload.getDirectory());
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
        log.info("배치 처리 일시 정지됨");
    }
    
    public void resumeProcessing() {
        processingConfig.getBatch().setEnabled(true);
        log.info("배치 처리 재개됨");
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