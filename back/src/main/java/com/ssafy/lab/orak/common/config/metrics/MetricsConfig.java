package com.ssafy.lab.orak.common.config.metrics;

import io.micrometer.core.instrument.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.atomic.AtomicLong;

@Configuration
@RequiredArgsConstructor
public class MetricsConfig {

    private final MeterRegistry meterRegistry;

    // 업로드 관련 메트릭
    @Bean
    public Counter uploadStartedCounter() {
        return Counter.builder("upload_started_total")
                .description("업로드 시도 총 횟수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    @Bean
    public Counter uploadCompletedCounter() {
        return Counter.builder("upload_completed_total")
                .description("업로드 성공 총 횟수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    @Bean
    public Counter uploadFailedCounter() {
        return Counter.builder("upload_failed_total")
                .description("업로드 실패 총 횟수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    @Bean("uploadDurationTimer")
    public Timer uploadDurationTimer() {
        return Timer.builder("upload_duration")
                .description("업로드 처리 소요 시간")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    // 처리 관련 메트릭
    @Bean("processingDurationTimer")
    public Timer processingDurationTimer() {
        return Timer.builder("processing_duration")
                .description("파일 처리 소요 시간")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    @Bean
    public AtomicLong activeUploadCount() {
        AtomicLong activeCount = new AtomicLong(0);
        Gauge.builder("upload_active_count", activeCount, AtomicLong::get)
                .description("현재 진행 중인 업로드 수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
        return activeCount;
    }

    @Bean
    public AtomicLong processingQueueSize() {
        AtomicLong queueSize = new AtomicLong(0);
        Gauge.builder("processing_queue_size", queueSize, AtomicLong::get)
                .description("처리 대기 중인 항목 수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
        return queueSize;
    }

    // 카프카 관련 메트릭 (기본 kafka 메트릭 외 추가)
    @Bean("kafkaMessagesSentCounter")
    public Counter kafkaMessagesSentCounter() {
        return Counter.builder("kafka_messages_sent_total")
                .description("카프카로 전송된 메시지 총 수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }

    @Bean("kafkaMessagesReceivedCounter")
    public Counter kafkaMessagesReceivedCounter() {
        return Counter.builder("kafka_messages_received_total")
                .description("카프카로부터 수신된 메시지 총 수")
                .tag("application", "orakgaraki")
                .register(meterRegistry);
    }
}