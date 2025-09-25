package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Log4j2
public class KafkaEventConsumer {

    private final ObjectMapper objectMapper;
    private final FileUploadService fileUploadService;
    private final EventDrivenProcessingService eventDrivenProcessingService;
    private final KafkaEventProducer kafkaEventProducer;
    
    // 처리 통계
    private final AtomicInteger processedEvents = new AtomicInteger(0);
    private final AtomicInteger failedEvents = new AtomicInteger(0);

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.upload-events')}", 
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-upload")
    public void handleUploadEvents(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);
            
            log.info("업로드 이벤트 처리 중: type={}, uploadId={}, partition={}, offset={}", 
                    event.getEventType(), event.getUploadId(), record.partition(), record.offset());

            switch (event.getEventType()) {
                case "UPLOAD_COMPLETED" -> handleUploadCompleted(event);
                case "PROCESSING_REQUESTED" -> handleProcessingRequested(event);
                default -> log.warn("알 수 없는 업로드 이벤트 타입: {}", event.getEventType());
            }

            // 수동 커밋
            ack.acknowledge();
            processedEvents.incrementAndGet();
            
            log.debug("업로드 이벤트 처리 완료: {}", event.getEventId());
            
        } catch (Exception e) {
            log.error("업로드 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();

            // 재시도 또는 DLQ 처리
            try {
                UploadEvent event = objectMapper.readValue(record.value(), UploadEvent.class);
                handleProcessingFailure(event, e);
            } catch (Exception parseException) {
                log.error("실패한 이벤트 파싱조차 실패: {}", record.value(), parseException);
            }

            ack.acknowledge();
        }
    }

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.processing-status')}", 
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-status")
    public void handleProcessingStatusEvents(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);
            
            log.info("처리 상태 이벤트 처리 중: uploadId={}, status={}, partition={}, offset={}", 
                    event.getUploadId(), event.getCurrentStatus(), record.partition(), record.offset());

            if ("STATUS_CHANGED".equals(event.getEventType())) {
                handleStatusChanged(event);
            }

            ack.acknowledge();
            processedEvents.incrementAndGet();
            
        } catch (Exception e) {
            log.error("상태 이벤트 처리 실패: partition={}, offset={}, value={}", 
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
            ack.acknowledge();
        }
    }

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.processing-results')}", 
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-results")
    public void handleProcessingResultEvents(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);
            
            log.info("처리 결과 이벤트 처리 중: uploadId={}, status={}, partition={}, offset={}", 
                    event.getUploadId(), event.getCurrentStatus(), record.partition(), record.offset());

            handleProcessingResult(event);

            ack.acknowledge();
            processedEvents.incrementAndGet();
            
        } catch (Exception e) {
            log.error("결과 이벤트 처리 실패: partition={}, offset={}, value={}", 
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
            ack.acknowledge();
        }
    }

    private void handleUploadCompleted(UploadEvent event) {
        try {
            // S3 업로드 완료 시 DB 상태 업데이트
            if (event.getUploadId() != null) {
                fileUploadService.updateProcessingStatus(event.getUploadId(), event.getCurrentStatus());
                log.info("업로드 상태 업데이트 완료 {} for uploadId: {}", 
                        event.getCurrentStatus(), event.getUploadId());
                
                // 추가 처리가 필요한 파일인지 확인
                if (Boolean.TRUE.equals(event.getRequiresAudioProcessing()) || 
                    Boolean.TRUE.equals(event.getRequiresImageProcessing())) {
                    
                    // 처리 요청 이벤트 생성
                    eventDrivenProcessingService.requestProcessing(event);
                }
            }
        } catch (Exception e) {
            log.error("업로드 완료 이벤트 처리 실패: {}", event, e);
        }
    }

    private void handleProcessingRequested(UploadEvent event) {
        try {
            // 처리 요청을 실제 처리 서비스로 전달
            eventDrivenProcessingService.processUploadEvent(event);
            
        } catch (Exception e) {
            log.error("처리 요청 이벤트 처리 실패: {}", event, e);
        }
    }

    private void handleStatusChanged(UploadEvent event) {
        try {
            // 상태 변경 이벤트를 다른 서비스들에 알림
            log.info("업로드 상태 변경: uploadId {}: {} -> {}", 
                    event.getUploadId(), event.getPreviousStatus(), event.getCurrentStatus());
            
            // 상태 변경에 따른 후속 처리
            eventDrivenProcessingService.handleStatusChange(event);
            
        } catch (Exception e) {
            log.error("상태 변경 처리 실패: {}", event, e);
        }
    }

    private void handleProcessingResult(UploadEvent event) {
        try {
            // 처리 결과를 최종 저장
            if (event.getUploadId() != null) {
                if (event.getErrorMessage() != null) {
                    fileUploadService.markProcessingFailed(event.getUploadId(), event.getErrorMessage());
                } else {
                    fileUploadService.updateProcessingStatus(event.getUploadId(), event.getCurrentStatus());
                }
                
                log.info("처리 결과 완료: uploadId: {}, finalStatus: {}", 
                        event.getUploadId(), event.getCurrentStatus());
            }
            
        } catch (Exception e) {
            log.error("처리 결과 처리 실패: {}", event, e);
        }
    }

    // 처리 통계 조회 메서드
    public ProcessingStatistics getEventProcessingStatistics() {
        return ProcessingStatistics.builder()
                .totalProcessed(processedEvents.get())
                .totalFailed(failedEvents.get())
                .successRate(calculateSuccessRate())
                .build();
    }

    private double calculateSuccessRate() {
        int total = processedEvents.get() + failedEvents.get();
        if (total == 0) return 100.0;
        return (double) processedEvents.get() / total * 100.0;
    }

    @lombok.Builder
    @lombok.Data
    public static class ProcessingStatistics {
        private int totalProcessed;
        private int totalFailed;
        private double successRate;
    }

    // ===============================================
    // DLQ 및 재시도 관련 메서드들
    // ===============================================

    private void handleProcessingFailure(UploadEvent event, Exception exception) {
        String errorMessage = String.format("Processing failed: %s", exception.getMessage());

        if (event.isEligibleForRetry()) {
            // 재시도 가능한 경우 재시도 토픽으로 전송
            log.warn("이벤트 재시도 예약: uploadId={}, retryCount={}, error={}",
                    event.getUploadId(), event.getRetryCount(), errorMessage);
            kafkaEventProducer.sendToRetryTopic(event);
        } else {
            // 최대 재시도 횟수 초과 시 DLQ로 전송
            log.error("최대 재시도 횟수 초과로 DLQ 이동: uploadId={}, retryCount={}, error={}",
                    event.getUploadId(), event.getRetryCount(), errorMessage);
            kafkaEventProducer.sendToDLQ(event, errorMessage);
        }
    }

    // ===============================================
    // 재시도 토픽 Consumer
    // ===============================================

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.upload-events-retry')}",
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-retry")
    public void handleRetryEvents(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.info("재시도 이벤트 처리 중: uploadId={}, retryCount={}, partition={}, offset={}",
                    event.getUploadId(), event.getRetryCount(), record.partition(), record.offset());

            // 재시도 지연 처리 (5분 지연)
            long retryDelayMinutes = 5;
            if (event.getLastRetryTime() != null) {
                long timeSinceLastRetry = java.time.Duration.between(
                        event.getLastRetryTime(),
                        java.time.LocalDateTime.now()
                ).toMinutes();

                if (timeSinceLastRetry < retryDelayMinutes) {
                    log.info("재시도 지연 시간 미충족, 다시 재시도 토픽으로: uploadId={}, timeSince={}분",
                            event.getUploadId(), timeSinceLastRetry);
                    kafkaEventProducer.sendToRetryTopic(event);
                    ack.acknowledge();
                    return;
                }
            }

            // 실제 재시도 처리
            switch (event.getEventType()) {
                case "UPLOAD_COMPLETED" -> handleUploadCompleted(event);
                case "PROCESSING_REQUESTED" -> handleProcessingRequested(event);
                case "RETRY_PROCESSING" -> handleProcessingRequested(event);
                default -> log.warn("알 수 없는 재시도 이벤트 타입: {}", event.getEventType());
            }

            ack.acknowledge();
            processedEvents.incrementAndGet();
            log.info("재시도 이벤트 처리 성공: uploadId={}, retryCount={}",
                    event.getUploadId(), event.getRetryCount());

        } catch (Exception e) {
            log.error("재시도 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();

            // 재시도 이벤트도 실패한 경우 DLQ로 전송
            try {
                UploadEvent event = objectMapper.readValue(record.value(), UploadEvent.class);
                kafkaEventProducer.sendToDLQ(event, "Retry event processing failed: " + e.getMessage());
            } catch (Exception parseException) {
                log.error("재시도 이벤트 파싱 실패: {}", record.value(), parseException);
            }

            ack.acknowledge();
        }
    }
}