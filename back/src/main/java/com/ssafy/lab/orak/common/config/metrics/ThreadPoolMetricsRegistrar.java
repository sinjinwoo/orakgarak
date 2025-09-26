package com.ssafy.lab.orak.common.config.metrics;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadPoolExecutor;

@Component
@RequiredArgsConstructor
@Log4j2
public class ThreadPoolMetricsRegistrar {

    private final MeterRegistry meterRegistry;

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

    @EventListener(ApplicationReadyEvent.class)
    public void registerMetrics() {
        try {
            log.info("Grafana용 고급 메트릭 등록 시작");

            // 스레드풀 메트릭 등록
            registerExecutorMetrics((ThreadPoolTaskExecutor) wavConversionExecutor, "wav_conversion");
            registerExecutorMetrics((ThreadPoolTaskExecutor) voiceAnalysisExecutor, "voice_analysis");
            registerExecutorMetrics((ThreadPoolTaskExecutor) imageProcessingExecutor, "image_processing");
            registerExecutorMetrics((ThreadPoolTaskExecutor) batchProcessingExecutor, "batch_processing");

            // 세마포어 메트릭 등록
            registerSemaphoreMetrics("wav_conversion", wavConversionSemaphore);
            registerSemaphoreMetrics("voice_analysis", voiceAnalysisSemaphore);
            registerSemaphoreMetrics("image_processing", imageProcessingSemaphore);
            registerSemaphoreMetrics("batch_processing", batchProcessingSemaphore);

            log.info("Grafana용 고급 메트릭 등록 완료 - 스레드풀 4개, 세마포어 4개");

        } catch (Exception e) {
            log.error("Grafana 메트릭 등록 중 오류 발생", e);
        }
    }

    private void registerExecutorMetrics(ThreadPoolTaskExecutor executor, String poolName) {
        ThreadPoolExecutor threadPoolExecutor = executor.getThreadPoolExecutor();

        // 활성 스레드 수
        Gauge.builder("threadpool_active_threads", threadPoolExecutor, ThreadPoolExecutor::getActiveCount)
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("활성 스레드 수")
                .register(meterRegistry);

        // 전체 스레드풀 크기
        Gauge.builder("threadpool_pool_size", threadPoolExecutor, ThreadPoolExecutor::getPoolSize)
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("현재 스레드풀 크기")
                .register(meterRegistry);

        // 최대 스레드풀 크기
        Gauge.builder("threadpool_max_pool_size", threadPoolExecutor, ThreadPoolExecutor::getMaximumPoolSize)
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("최대 스레드풀 크기")
                .register(meterRegistry);

        // 대기 큐 크기
        Gauge.builder("threadpool_queue_size", threadPoolExecutor, tpe -> (double) tpe.getQueue().size())
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("대기 큐 크기")
                .register(meterRegistry);

        // 완료된 작업 수
        Gauge.builder("threadpool_completed_tasks", threadPoolExecutor, tpe -> (double) tpe.getCompletedTaskCount())
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("완료된 작업 수")
                .register(meterRegistry);

        // 스레드풀 사용률 (%)
        Gauge.builder("threadpool_utilization_percent", threadPoolExecutor, tpe ->
                    tpe.getMaximumPoolSize() > 0 ?
                    (double) tpe.getActiveCount() / tpe.getMaximumPoolSize() * 100.0 : 0.0)
                .tag("application", "orakgaraki")
                .tag("pool", poolName)
                .description("스레드풀 사용률")
                .register(meterRegistry);

        log.debug("스레드풀 메트릭 등록 완료: {}", poolName);
    }

    private void registerSemaphoreMetrics(String semaphoreName, Semaphore semaphore) {
        // 사용 가능한 허가 수
        Gauge.builder("semaphore_available_permits", semaphore, sem -> (double) sem.availablePermits())
                .tag("application", "orakgaraki")
                .tag("semaphore", semaphoreName)
                .description("사용 가능한 허가 수")
                .register(meterRegistry);

        // 대기 큐 길이
        Gauge.builder("semaphore_queue_length", semaphore, sem -> (double) sem.getQueueLength())
                .tag("application", "orakgaraki")
                .tag("semaphore", semaphoreName)
                .description("세마포어 대기 큐 길이")
                .register(meterRegistry);

        // 세마포어 사용률 (간단한 버전)
        Gauge.builder("semaphore_utilization_percent", semaphore, sem -> {
                    int available = sem.availablePermits();
                    // 간단한 사용률 계산 (사용 중인 허가 비율)
                    return available >= 0 ? (10.0 - available) / 10.0 * 100.0 : 0.0;
                })
                .tag("application", "orakgaraki")
                .tag("semaphore", semaphoreName)
                .description("세마포어 사용률")
                .register(meterRegistry);

        log.debug("세마포어 메트릭 등록 완료: {}", semaphoreName);
    }
}