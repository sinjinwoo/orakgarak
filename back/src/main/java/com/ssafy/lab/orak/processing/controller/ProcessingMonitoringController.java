package com.ssafy.lab.orak.processing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadPoolExecutor;

@RestController
@RequestMapping("/processing/monitoring")
@RequiredArgsConstructor
@Log4j2
@Tag(name = "Processing Monitoring", description = "처리 시스템 모니터링 API")
public class ProcessingMonitoringController {

    @Qualifier("wavConversionExecutor")
    private final Executor wavConversionExecutor;

    @Qualifier("voiceAnalysisExecutor")
    private final Executor voiceAnalysisExecutor;

    @Qualifier("imageProcessingExecutor")
    private final Executor imageProcessingExecutor;

    @Qualifier("batchProcessingExecutor")
    private final Executor batchProcessingExecutor;

    @Qualifier("wavConversionSemaphore")
    private final Semaphore wavConversionSemaphore;

    @Qualifier("voiceAnalysisSemaphore")
    private final Semaphore voiceAnalysisSemaphore;

    @Qualifier("imageProcessingSemaphore")
    private final Semaphore imageProcessingSemaphore;

    @Qualifier("batchProcessingSemaphore")
    private final Semaphore batchProcessingSemaphore;

    @GetMapping("/thread-pools")
    @Operation(summary = "스레드풀 상태 조회", description = "모든 스레드풀의 현재 상태를 조회합니다.")
    public ResponseEntity<ThreadPoolStatusResponse> getThreadPoolStatus() {

        log.info("스레드풀 모니터링 상태 조회 요청");

        ThreadPoolStatusResponse response = ThreadPoolStatusResponse.builder()
                .wavConversion(getExecutorMetrics((ThreadPoolTaskExecutor) wavConversionExecutor, "WAV변환"))
                .voiceAnalysis(getExecutorMetrics((ThreadPoolTaskExecutor) voiceAnalysisExecutor, "음성분석"))
                .imageProcessing(getExecutorMetrics((ThreadPoolTaskExecutor) imageProcessingExecutor, "이미지처리"))
                .batchProcessing(getExecutorMetrics((ThreadPoolTaskExecutor) batchProcessingExecutor, "배치처리"))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/semaphores")
    @Operation(summary = "세마포어 상태 조회", description = "모든 세마포어의 현재 상태를 조회합니다.")
    public ResponseEntity<SemaphoreStatusResponse> getSemaphoreStatus() {

        log.info("세마포어 모니터링 상태 조회 요청");

        SemaphoreStatusResponse response = SemaphoreStatusResponse.builder()
                .wavConversion(getSemaphoreMetrics(wavConversionSemaphore, "WAV변환"))
                .voiceAnalysis(getSemaphoreMetrics(voiceAnalysisSemaphore, "음성분석"))
                .imageProcessing(getSemaphoreMetrics(imageProcessingSemaphore, "이미지처리"))
                .batchProcessing(getSemaphoreMetrics(batchProcessingSemaphore, "배치처리"))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @Operation(summary = "전체 처리 시스템 요약", description = "스레드풀과 세마포어 상태를 요약해서 조회합니다.")
    public ResponseEntity<ProcessingSystemSummary> getSystemSummary() {

        log.info("처리 시스템 전체 요약 조회 요청");

        ProcessingSystemSummary summary = ProcessingSystemSummary.builder()
                .threadPools(ThreadPoolStatusResponse.builder()
                        .wavConversion(getExecutorMetrics((ThreadPoolTaskExecutor) wavConversionExecutor, "WAV변환"))
                        .voiceAnalysis(getExecutorMetrics((ThreadPoolTaskExecutor) voiceAnalysisExecutor, "음성분석"))
                        .imageProcessing(getExecutorMetrics((ThreadPoolTaskExecutor) imageProcessingExecutor, "이미지처리"))
                        .batchProcessing(getExecutorMetrics((ThreadPoolTaskExecutor) batchProcessingExecutor, "배치처리"))
                        .build())
                .semaphores(SemaphoreStatusResponse.builder()
                        .wavConversion(getSemaphoreMetrics(wavConversionSemaphore, "WAV변환"))
                        .voiceAnalysis(getSemaphoreMetrics(voiceAnalysisSemaphore, "음성분석"))
                        .imageProcessing(getSemaphoreMetrics(imageProcessingSemaphore, "이미지처리"))
                        .batchProcessing(getSemaphoreMetrics(batchProcessingSemaphore, "배치처리"))
                        .build())
                .systemHealth(calculateSystemHealth())
                .build();

        return ResponseEntity.ok(summary);
    }

    // 스레드풀 메트릭 수집
    private ExecutorMetrics getExecutorMetrics(ThreadPoolTaskExecutor executor, String name) {
        ThreadPoolExecutor threadPoolExecutor = executor.getThreadPoolExecutor();

        return ExecutorMetrics.builder()
                .name(name)
                .corePoolSize(threadPoolExecutor.getCorePoolSize())
                .maxPoolSize(threadPoolExecutor.getMaximumPoolSize())
                .activeThreads(threadPoolExecutor.getActiveCount())
                .poolSize(threadPoolExecutor.getPoolSize())
                .queueSize(threadPoolExecutor.getQueue().size())
                .queueCapacity(executor.getQueueCapacity())
                .completedTasks(threadPoolExecutor.getCompletedTaskCount())
                .totalTasks(threadPoolExecutor.getTaskCount())
                .utilizationPercentage(calculateUtilization(threadPoolExecutor))
                .isHealthy(isExecutorHealthy(threadPoolExecutor))
                .build();
    }

    // 세마포어 메트릭 수집
    private SemaphoreMetrics getSemaphoreMetrics(Semaphore semaphore, String name) {
        int availablePermits = semaphore.availablePermits();
        int queueLength = semaphore.getQueueLength();

        return SemaphoreMetrics.builder()
                .name(name)
                .availablePermits(availablePermits)
                .queueLength(queueLength)
                .isHealthy(availablePermits > 0 || queueLength < 10) // 임시 기준
                .build();
    }

    // 스레드풀 사용률 계산
    private double calculateUtilization(ThreadPoolExecutor executor) {
        if (executor.getMaximumPoolSize() == 0) return 0.0;
        return (double) executor.getActiveCount() / executor.getMaximumPoolSize() * 100.0;
    }

    // 스레드풀 건강성 확인
    private boolean isExecutorHealthy(ThreadPoolExecutor executor) {
        // 큐가 90% 이상 찬 경우 불건전으로 판단
        int queueCapacity = executor.getQueue().remainingCapacity() + executor.getQueue().size();
        if (queueCapacity > 0) {
            double queueUtilization = (double) executor.getQueue().size() / queueCapacity;
            return queueUtilization < 0.9;
        }
        return true;
    }

    // 시스템 전체 건강성 계산
    private SystemHealthMetrics calculateSystemHealth() {
        ThreadPoolTaskExecutor[] executors = {
            (ThreadPoolTaskExecutor) wavConversionExecutor,
            (ThreadPoolTaskExecutor) voiceAnalysisExecutor,
            (ThreadPoolTaskExecutor) imageProcessingExecutor,
            (ThreadPoolTaskExecutor) batchProcessingExecutor
        };

        int healthyExecutors = 0;
        int totalActiveThreads = 0;
        long totalCompletedTasks = 0;

        for (ThreadPoolTaskExecutor executor : executors) {
            ThreadPoolExecutor tpe = executor.getThreadPoolExecutor();
            if (isExecutorHealthy(tpe)) {
                healthyExecutors++;
            }
            totalActiveThreads += tpe.getActiveCount();
            totalCompletedTasks += tpe.getCompletedTaskCount();
        }

        double systemHealthPercentage = (double) healthyExecutors / executors.length * 100.0;

        return SystemHealthMetrics.builder()
                .overallHealthPercentage(systemHealthPercentage)
                .totalActiveThreads(totalActiveThreads)
                .totalCompletedTasks(totalCompletedTasks)
                .isSystemHealthy(systemHealthPercentage >= 75.0)
                .build();
    }

    // DTO 클래스들
    @lombok.Builder
    @lombok.Getter
    public static class ThreadPoolStatusResponse {
        private ExecutorMetrics wavConversion;
        private ExecutorMetrics voiceAnalysis;
        private ExecutorMetrics imageProcessing;
        private ExecutorMetrics batchProcessing;
    }

    @lombok.Builder
    @lombok.Getter
    public static class SemaphoreStatusResponse {
        private SemaphoreMetrics wavConversion;
        private SemaphoreMetrics voiceAnalysis;
        private SemaphoreMetrics imageProcessing;
        private SemaphoreMetrics batchProcessing;
    }

    @lombok.Builder
    @lombok.Getter
    public static class ProcessingSystemSummary {
        private ThreadPoolStatusResponse threadPools;
        private SemaphoreStatusResponse semaphores;
        private SystemHealthMetrics systemHealth;
    }

    @lombok.Builder
    @lombok.Getter
    public static class ExecutorMetrics {
        private String name;
        private int corePoolSize;
        private int maxPoolSize;
        private int activeThreads;
        private int poolSize;
        private int queueSize;
        private int queueCapacity;
        private long completedTasks;
        private long totalTasks;
        private double utilizationPercentage;
        private boolean isHealthy;
    }

    @lombok.Builder
    @lombok.Getter
    public static class SemaphoreMetrics {
        private String name;
        private int availablePermits;
        private int queueLength;
        private boolean isHealthy;
    }

    @lombok.Builder
    @lombok.Getter
    public static class SystemHealthMetrics {
        private double overallHealthPercentage;
        private int totalActiveThreads;
        private long totalCompletedTasks;
        private boolean isSystemHealthy;
    }
}