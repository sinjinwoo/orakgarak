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
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.Executor;

import java.util.concurrent.atomic.AtomicLong;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Log4j2
public class BatchProcessingService {

    private final FileUploadService fileUploadService;
    private final ProcessingConfig processingConfig;
    private final List<ProcessingJob> processingJobs;
    private final Timer processingDurationTimer;
    private final AtomicLong processingQueueSize;
    private final RecordRepository recordRepository;

    // 각 작업 타입별 전용 스레드풀 + 세마포어
    @Qualifier("wavConversionExecutor")
    private final Executor wavConversionExecutor;

    @Qualifier("voiceAnalysisExecutor")
    private final Executor voiceAnalysisExecutor;

    @Qualifier("imageProcessingExecutor")
    private final Executor imageProcessingExecutor;

    @Qualifier("batchProcessingExecutor")
    private final Executor batchProcessingExecutor;

    // 각 작업 타입별 전용 세마포어
    @Qualifier("wavConversionSemaphore")
    private final Semaphore wavConversionSemaphore;

    @Qualifier("voiceAnalysisSemaphore")
    private final Semaphore voiceAnalysisSemaphore;

    @Qualifier("imageProcessingSemaphore")
    private final Semaphore imageProcessingSemaphore;

    @Qualifier("batchProcessingSemaphore")
    private final Semaphore batchProcessingSemaphore;

    // 전체 활성 작업 카운터 (모니터링용)
    private final AtomicInteger activeJobs = new AtomicInteger(0);

    // 30분마다 실행하여 Kafka에서 놓친 파일들만 배치로 처리 (DLQ 복구 목적)
    @Scheduled(fixedRateString = "#{${processing.batch.interval-ms:1800000}}")
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
        
        // Kafka가 정상적으로 처리하고 있는지 확인
        if (isKafkaProcessingHealthy()) {
            log.debug("Kafka 처리가 정상적으로 작동 중이므로 배치 처리 스킵");
            return;
        }

        log.info("Kafka 처리 이슈 감지 또는 복구 필요 - 배치 처리 시작: 활성: {}, 가용: {}, 배치 크기: {}",
                currentActive, availableSlots, actualBatchSize);

        // Kafka에서 놓친 파일들만 조회 (최소 10분 이상 처리되지 않은 파일들)
        List<Upload> stuckUploads = fileUploadService.findStuckUploads(
                actualBatchSize,
                10 * 60 * 1000L // 10분 이상 처리되지 않은 파일들
        );

        // 큐 크기 업데이트
        processingQueueSize.set(stuckUploads.size());

        if (stuckUploads.isEmpty()) {
            log.debug("Kafka에서 놓친 파일이 없습니다 - 배치 처리 완료");
            return;
        }

        log.info("Kafka에서 놓친 파일 {}개 발견 - 배치로 복구 처리", stuckUploads.size());

        // 각 파일에 대해 작업 타입별 전용 스레드풀에서 비동기 처리
        for (Upload upload : stuckUploads) {
            executeProcessingByType(upload);
        }
    }
    
    /**
     * 작업 타입에 따라 적절한 스레드풀에서 처리 실행
     */
    private void executeProcessingByType(Upload upload) {
        ProcessingJob selectedJob = findApplicableJob(upload);

        if (selectedJob == null) {
            log.warn("업로드에 적용 가능한 처리 작업을 찾을 수 없음: {}", upload.getId());
            return;
        }

        // 작업 타입별로 전용 스레드풀과 세마포어 사용
        if (isWavConversionJob(selectedJob)) {
            wavConversionExecutor.execute(() -> processWithSemaphore(upload, selectedJob, wavConversionSemaphore, "WAV변환"));
        } else if (isVoiceAnalysisJob(selectedJob)) {
            voiceAnalysisExecutor.execute(() -> processWithSemaphore(upload, selectedJob, voiceAnalysisSemaphore, "음성분석"));
        } else if (isImageProcessingJob(selectedJob)) {
            imageProcessingExecutor.execute(() -> processWithSemaphore(upload, selectedJob, imageProcessingSemaphore, "이미지처리"));
        } else {
            batchProcessingExecutor.execute(() -> processWithSemaphore(upload, selectedJob, batchProcessingSemaphore, "배치처리"));
        }
    }

    /**
     * 세마포어를 사용한 실제 처리 로직
     */
    private void processWithSemaphore(Upload upload, ProcessingJob job, Semaphore semaphore, String jobType) {
        Timer.Sample sample = Timer.start();
        try {
            // 세마포어로 동시성 제어
            semaphore.acquire();
            activeJobs.incrementAndGet();

            log.info("{} 처리 시작: {} ({})", jobType, upload.getId(), upload.getOriginalFilename());

            // Recording 파일인 경우 Record 존재 확인
            if (isRecordingUpload(upload)) {
                var recordOpt = recordRepository.findByUploadId(upload.getId());
                if (recordOpt.isEmpty()) {
                    log.info("Record가 아직 생성되지 않음, 다음 배치에서 재시도: uploadId={}", upload.getId());
                    return; // 스킵하고 다음 배치에서 재시도
                }
                Record record = recordOpt.get();
                log.info("Record 확인 완료: uploadId={}, recordId={}, title={}",
                        upload.getId(), record.getId(), record.getTitle());
            }

            // 처리 시작 상태 업데이트
            fileUploadService.updateProcessingStatus(upload.getId(), job.getProcessingStatus());

            // 실제 처리 수행
            boolean success = job.process(upload);

            if (success) {
                // 처리 성공 - 상태 업데이트 시 자동으로 재시도 카운터 리셋됨
                fileUploadService.updateProcessingStatus(upload.getId(), job.getCompletedStatus());
                log.info("{} 처리 성공: {} (작업: {})",
                        jobType, upload.getId(), job.getClass().getSimpleName());
            } else {
                // 처리 실패 - 재시도 또는 최종 실패 처리
                handleProcessingFailure(upload, job,
                        String.format("{} 처리 실패: {}", jobType, job.getClass().getSimpleName()));
            }

        } catch (BatchProcessingException e) {
            log.error("{} 배치 처리 실패: uploadId={}", jobType, upload.getId(), e);
            fileUploadService.markProcessingFailed(upload.getId(),
                    jobType + " 배치 처리 실패: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("{} 배치 처리 중 예상치 못한 오류 발생: uploadId={}", jobType, upload.getId(), e);
            fileUploadService.markProcessingFailed(upload.getId(),
                    jobType + " 배치 처리 중 예상치 못한 오류: " + e.getMessage());
            throw new BatchProcessingException(jobType + " 배치 처리 중 예상치 못한 오류가 발생했습니다", e);
        } finally {
            sample.stop(processingDurationTimer);
            activeJobs.decrementAndGet();
            semaphore.release();
        }
    }

    // 작업 타입 판별 메서드들
    private boolean isWavConversionJob(ProcessingJob job) {
        return job.getClass().getSimpleName().contains("AudioFormatConversion");
    }

    private boolean isVoiceAnalysisJob(ProcessingJob job) {
        return job.getClass().getSimpleName().contains("VoiceAnalysis");
    }

    private boolean isImageProcessingJob(ProcessingJob job) {
        return job.getClass().getSimpleName().contains("Image") ||
               job.getClass().getSimpleName().contains("Thumbnail");
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
     * Kafka DLQ와 달리 배치 처리 실패는 DB에만 기록
     */
    private void moveToDeadLetterQueue(Upload upload, String finalErrorMessage) {
        upload.markProcessingFailed("Batch DLQ: " + finalErrorMessage +
                " (재시도 " + upload.getRetryCount() + "회 실패)");
        fileUploadService.save(upload);

        log.error("파일을 배치 DLQ로 이동: uploadId={}, originalFilename={}, finalError={}",
                upload.getId(), upload.getOriginalFilename(), finalErrorMessage);
    }

    /**
     * Recording 디렉토리의 Upload인지 확인
     */
    private boolean isRecordingUpload(Upload upload) {
        return "recordings".equals(upload.getDirectory());
    }

    /**
     * Kafka 처리가 정상적으로 작동하는지 확인
     */
    private boolean isKafkaProcessingHealthy() {
        try {
            // 최근 10분간 업로드된 파일들 중에서
            long tenMinutesAgo = System.currentTimeMillis() - (10 * 60 * 1000);

            // PENDING 상태로 오랫동안 남아있는 파일 개수 확인
            long stuckCount = fileUploadService.countStuckUploads(tenMinutesAgo);

            // 10개 이상의 파일이 10분 이상 처리되지 않으면 Kafka 이슈로 판단
            if (stuckCount >= 10) {
                log.warn("Kafka 처리 이슈 감지: {}개 파일이 10분 이상 처리되지 않음", stuckCount);
                return false;
            }

            return true;

        } catch (Exception e) {
            log.error("Kafka 헬스 체크 중 오류 발생", e);
            return false; // 확인할 수 없으면 배치 처리 실행
        }
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