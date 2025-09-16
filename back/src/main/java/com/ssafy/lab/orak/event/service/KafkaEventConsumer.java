package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    private final ObjectMapper objectMapper;
    private final FileUploadService fileUploadService;
    private final EventDrivenProcessingService eventDrivenProcessingService;
    
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
            
            // 실패 시에도 ACK (재시도 로직은 별도 구현 필요)
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
}