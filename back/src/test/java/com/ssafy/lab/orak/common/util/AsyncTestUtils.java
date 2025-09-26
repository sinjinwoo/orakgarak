package com.ssafy.lab.orak.common.util;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 비동기 테스트를 위한 유틸리티 클래스
 * 테스트 품질 개선을 위한 공통 기능 제공
 */
@Slf4j
public class AsyncTestUtils {

    /**
     * 조건이 만족될 때까지 대기하는 유틸리티 메서드
     *
     * @param condition 체크할 조건
     * @param timeoutSeconds 최대 대기 시간 (초)
     * @param pollIntervalMs 폴링 간격 (밀리초)
     * @param description 대기 중인 작업 설명
     * @return 조건이 만족되면 true, 타임아웃이면 false
     */
    public static boolean waitUntil(Supplier<Boolean> condition, long timeoutSeconds, long pollIntervalMs, String description) {
        long startTime = System.currentTimeMillis();
        long timeoutMs = timeoutSeconds * 1000;

        log.debug("대기 시작: {}", description);

        while (System.currentTimeMillis() - startTime < timeoutMs) {
            try {
                if (condition.get()) {
                    log.debug("조건 만족: {} (소요시간: {}ms)", description, System.currentTimeMillis() - startTime);
                    return true;
                }
                Thread.sleep(pollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("대기 중 인터럽트 발생: {}", description);
                return false;
            }
        }

        log.warn("타임아웃 발생: {} ({}초)", description, timeoutSeconds);
        return false;
    }

    /**
     * 비동기 작업 완료를 대기하는 헬퍼 클래스
     */
    public static class AsyncWaiter {
        private final CountDownLatch latch;
        private final AtomicReference<Exception> error = new AtomicReference<>();

        public AsyncWaiter(int expectedCount) {
            this.latch = new CountDownLatch(expectedCount);
        }

        public void countDown() {
            latch.countDown();
        }

        public void countDown(Exception error) {
            this.error.set(error);
            latch.countDown();
        }

        public boolean await(long timeout, TimeUnit unit) throws InterruptedException {
            return latch.await(timeout, unit);
        }

        public Exception getError() {
            return error.get();
        }

        public long getCount() {
            return latch.getCount();
        }
    }

    /**
     * 성능 측정을 위한 헬퍼 클래스
     */
    public static class PerformanceTimer {
        private final long startTime;
        private final String operation;

        public PerformanceTimer(String operation) {
            this.operation = operation;
            this.startTime = System.currentTimeMillis();
            log.debug("성능 측정 시작: {}", operation);
        }

        public long stop() {
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("성능 측정 완료: {} - {}ms", operation, elapsed);
            return elapsed;
        }

        public long getElapsed() {
            return System.currentTimeMillis() - startTime;
        }
    }

    /**
     * 테스트 통계를 위한 헬퍼 클래스
     */
    public static class TestStatistics {
        private long totalOperations = 0;
        private long successfulOperations = 0;
        private long failedOperations = 0;
        private long totalTime = 0;

        public void recordSuccess(long operationTime) {
            totalOperations++;
            successfulOperations++;
            totalTime += operationTime;
        }

        public void recordFailure(long operationTime) {
            totalOperations++;
            failedOperations++;
            totalTime += operationTime;
        }

        public double getSuccessRate() {
            return totalOperations > 0 ? (double) successfulOperations / totalOperations * 100.0 : 0.0;
        }

        public double getAverageTime() {
            return totalOperations > 0 ? (double) totalTime / totalOperations : 0.0;
        }

        public long getTotalOperations() { return totalOperations; }
        public long getSuccessfulOperations() { return successfulOperations; }
        public long getFailedOperations() { return failedOperations; }
        public long getTotalTime() { return totalTime; }

        public void logResults(String testName) {
            log.info("=== {} 통계 결과 ===", testName);
            log.info("총 작업: {}, 성공: {}, 실패: {}", totalOperations, successfulOperations, failedOperations);
            log.info("성공률: {:.2f}%, 평균 처리시간: {:.2f}ms", getSuccessRate(), getAverageTime());
            log.info("총 처리시간: {}ms", totalTime);
        }
    }

    /**
     * 카프카 이벤트 테스트를 위한 특화된 대기 메서드
     */
    public static boolean waitForKafkaEventProcessing(Supplier<Long> getProcessedCount,
                                                      long expectedMinCount,
                                                      long timeoutSeconds,
                                                      String eventType) {
        return waitUntil(
            () -> getProcessedCount.get() >= expectedMinCount,
            timeoutSeconds,
            500, // 500ms 간격으로 체크
            String.format("%s 이벤트 처리 대기 (최소 %d개)", eventType, expectedMinCount)
        );
    }

    /**
     * 배치 처리 완료를 대기하는 메서드
     */
    public static boolean waitForBatchProcessingCompletion(Supplier<Boolean> isProcessingComplete,
                                                           long timeoutSeconds) {
        return waitUntil(
            isProcessingComplete,
            timeoutSeconds,
            1000, // 1초 간격으로 체크
            "배치 처리 완료 대기"
        );
    }
}