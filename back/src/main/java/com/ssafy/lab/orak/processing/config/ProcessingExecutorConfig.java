package com.ssafy.lab.orak.processing.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@Log4j2
public class ProcessingExecutorConfig {

    // WAV 변환용 스레드풀 (빠른 처리, 높은 동시성)
    @Bean("wavConversionExecutor")
    public Executor wavConversionExecutor(
            @Value("${processing.audio.wav-conversion.core-pool-size:5}") int corePoolSize,
            @Value("${processing.audio.wav-conversion.max-pool-size:10}") int maxPoolSize,
            @Value("${processing.audio.wav-conversion.queue-capacity:50}") int queueCapacity) {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("WavConv-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        // WAV 변환 대기 큐가 가득 찬 경우 처리 정책
        executor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                log.warn("WAV 변환 스레드풀 대기 큐 가득참 - 현재 작업: {}, 큐 크기: {}",
                        executor.getActiveCount(), executor.getQueue().size());
                // CallerRunsPolicy: 호출한 스레드에서 직접 실행 (블록킹)
                if (!executor.isShutdown()) {
                    r.run();
                }
            }
        });

        executor.initialize();
        log.info("WAV 변환 전용 스레드풀 초기화 완료 - Core: {}, Max: {}, Queue: {}",
                corePoolSize, maxPoolSize, queueCapacity);
        return executor;
    }

    // 음성 분석용 스레드풀 (무거운 처리, 제한적 동시성)
    @Bean("voiceAnalysisExecutor")
    public Executor voiceAnalysisExecutor(
            @Value("${processing.audio.voice-analysis.core-pool-size:2}") int corePoolSize,
            @Value("${processing.audio.voice-analysis.max-pool-size:4}") int maxPoolSize,
            @Value("${processing.audio.voice-analysis.queue-capacity:20}") int queueCapacity) {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(300); // 5분 (긴 작업이므로 스레드 오래 유지)
        executor.setThreadNamePrefix("VoiceAnalysis-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60); // 긴 작업 고려하여 대기 시간 증가

        // 음성 분석 대기 큐가 가득 찬 경우 처리 정책
        executor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                log.warn("음성 분석 스레드풀 포화 상태 - 현재 작업: {}, 큐 크기: {}",
                        executor.getActiveCount(), executor.getQueue().size());
                // DiscardOldestPolicy: 가장 오래된 대기 작업을 버리고 새 작업 추가
                if (!executor.isShutdown()) {
                    executor.getQueue().poll();
                    executor.execute(r);
                    log.info("가장 오래된 음성 분석 작업을 제거하고 새 작업 추가");
                }
            }
        });

        executor.initialize();
        log.info("음성 분석 전용 스레드풀 초기화 완료 - Core: {}, Max: {}, Queue: {}",
                corePoolSize, maxPoolSize, queueCapacity);
        return executor;
    }

    // 이미지 처리용 스레드풀 (중간 처리, 중간 동시성)
    @Bean("imageProcessingExecutor")
    public Executor imageProcessingExecutor(
            @Value("${processing.image.core-pool-size:3}") int corePoolSize,
            @Value("${processing.image.max-pool-size:6}") int maxPoolSize,
            @Value("${processing.image.queue-capacity:30}") int queueCapacity) {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(120);
        executor.setThreadNamePrefix("ImageProc-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(45);

        // 이미지 처리 대기 큐가 가득 찬 경우 처리 정책
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                log.warn("이미지 처리 스레드풀 포화 상태 - 호출 스레드에서 직접 처리");
                super.rejectedExecution(r, executor);
            }
        });

        executor.initialize();
        log.info("이미지 처리 전용 스레드풀 초기화 완료 - Core: {}, Max: {}, Queue: {}",
                corePoolSize, maxPoolSize, queueCapacity);
        return executor;
    }

    // 일반 배치 처리용 스레드풀 (기타 작업)
    @Bean("batchProcessingExecutor")
    public Executor batchProcessingExecutor(
            @Value("${processing.batch.core-pool-size:2}") int corePoolSize,
            @Value("${processing.batch.max-pool-size:4}") int maxPoolSize,
            @Value("${processing.batch.queue-capacity:25}") int queueCapacity) {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(180);
        executor.setThreadNamePrefix("BatchProc-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                log.error("배치 처리 스레드풀 포화 - 작업 거부됨");
                super.rejectedExecution(r, executor);
            }
        });

        executor.initialize();
        log.info("배치 처리 전용 스레드풀 초기화 완료 - Core: {}, Max: {}, Queue: {}",
                corePoolSize, maxPoolSize, queueCapacity);
        return executor;
    }

    // ===============================================
    // 세마포어 Bean 등록 (대기업 방식: 스레드풀 + 세마포어 이중 제어)
    // ===============================================

    @Bean("wavConversionSemaphore")
    public Semaphore wavConversionSemaphore(
            @Value("${processing.audio.wav-conversion.semaphore-permits:8}") int permits) {
        log.info("WAV 변환 전용 세마포어 초기화 - 허용 개수: {}", permits);
        return new Semaphore(permits, true); // fair 정책
    }

    @Bean("voiceAnalysisSemaphore")
    public Semaphore voiceAnalysisSemaphore(
            @Value("${processing.audio.voice-analysis.semaphore-permits:2}") int permits) {
        log.info("음성 분석 전용 세마포어 초기화 - 허용 개수: {}", permits);
        return new Semaphore(permits, true); // fair 정책
    }

    @Bean("imageProcessingSemaphore")
    public Semaphore imageProcessingSemaphore(
            @Value("${processing.image.semaphore-permits:4}") int permits) {
        log.info("이미지 처리 전용 세마포어 초기화 - 허용 개수: {}", permits);
        return new Semaphore(permits, true); // fair 정책
    }

    @Bean("batchProcessingSemaphore")
    public Semaphore batchProcessingSemaphore(
            @Value("${processing.batch.semaphore-permits:3}") int permits) {
        log.info("배치 처리 전용 세마포어 초기화 - 허용 개수: {}", permits);
        return new Semaphore(permits, true); // fair 정책
    }
}