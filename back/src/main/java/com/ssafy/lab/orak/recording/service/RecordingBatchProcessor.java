package com.ssafy.lab.orak.recording.service;

import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;

/**
 * Recording 배치 처리기
 * - 설정 가능한 배치 크기로 처리
 * - 동시 처리 개수 제한
 * - 스케줄링으로 주기적 실행
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingBatchProcessor {

    private final RecordRepository recordRepository;
    private final AsyncRecordService asyncRecordService;

    @Value("${recording.batch.size:5}")
    private int batchSize;

    @Value("${recording.batch.max-concurrent:3}")
    private int maxConcurrentJobs;

    @Value("${recording.batch.enabled:true}")
    private boolean batchEnabled;

    // 동시 처리 제한을 위한 세마포어
    private final Semaphore semaphore = new Semaphore(3); // 기본값 3

    /**
     * 주기적으로 실행되는 배치 처리 (10초마다)
     */
    @Scheduled(fixedDelay = 10000)
    public void processRecordingBatch() {
        if (!batchEnabled) {
            log.debug("Recording 배치 처리가 비활성화되어 있습니다.");
            return;
        }

        try {
            // UPLOADED 상태의 Record들을 배치 크기만큼 조회
            Pageable pageable = PageRequest.of(0, batchSize);
            List<Record> pendingRecords = recordRepository
                .findPendingRecordsWithUpload(ProcessingStatus.UPLOADED, pageable);

            if (pendingRecords.isEmpty()) {
                log.debug("처리할 Recording이 없습니다.");
                return;
            }

            log.info("Recording 배치 처리 시작: {}개 레코드 처리", pendingRecords.size());

            // 비동기로 각 Record 처리
            List<CompletableFuture<Void>> futures = pendingRecords.stream()
                    .map(record -> processRecordAsync(record.getUploadId()))
                    .toList();

            // 모든 처리 완료 대기
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .whenComplete((result, throwable) -> {
                        if (throwable != null) {
                            log.error("Recording 배치 처리 중 오류 발생", throwable);
                        } else {
                            log.info("Recording 배치 처리 완료: {}개 레코드", pendingRecords.size());
                        }
                    });

        } catch (Exception e) {
            log.error("Recording 배치 처리 실패", e);
            throw new RecordOperationException("Recording 배치 처리에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 개별 Record 비동기 처리
     */
    @Async
    public CompletableFuture<Void> processRecordAsync(Long uploadId) {
        try {
            // 세마포어로 동시 처리 개수 제한
            semaphore.acquire();

            log.debug("Recording 처리 시작: uploadId={} (Kafka ProcessingJob에서 이미 처리됨)", uploadId);
            // processRecordingAsync 제거 - 이미 EventBridge → Kafka로 자동 처리됨
            log.debug("Recording 처리 완료: uploadId={}", uploadId);

            return CompletableFuture.completedFuture(null);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("레코딩 처리가 중단되었습니다: uploadId={}", uploadId, e);
            throw new RecordOperationException("레코딩 처리가 중단되었습니다", e);

        } catch (Exception e) {
            log.error("레코딩 처리에 실패했습니다: uploadId={}", uploadId, e);
            throw new RecordOperationException("레코딩 처리에 실패했습니다", e);

        } finally {
            semaphore.release();
        }
    }

    /**
     * 수동으로 배치 처리 트리거 (테스트용)
     */
    public void triggerManualBatch() {
        log.info("수동 Recording 배치 처리 시작");
        processRecordingBatch();
    }

    /**
     * 배치 처리 설정 조회
     */
    public BatchConfig getBatchConfig() {
        return BatchConfig.builder()
                .batchSize(batchSize)
                .maxConcurrentJobs(maxConcurrentJobs)
                .batchEnabled(batchEnabled)
                .currentActiveJobs(maxConcurrentJobs - semaphore.availablePermits())
                .build();
    }

    /**
     * 배치 처리 활성화/비활성화
     */
    public void setBatchEnabled(boolean enabled) {
        this.batchEnabled = enabled;
        log.info("Recording 배치 처리 상태 변경: {}", enabled ? "활성화" : "비활성화");
    }

    /**
     * 배치 크기 동적 변경 (테스트용)
     */
    public void setBatchSize(int size) {
        this.batchSize = Math.max(1, Math.min(size, 20)); // 1~20 제한
        log.info("Recording 배치 크기 변경: {}", this.batchSize);
    }

    /**
     * 배치 설정 정보
     */
    @lombok.Data
    @lombok.Builder
    public static class BatchConfig {
        private int batchSize;
        private int maxConcurrentJobs;
        private boolean batchEnabled;
        private int currentActiveJobs;
    }
}