package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${kafka.topics.upload-events}")
    private String uploadEventsTopic;

    @Value("${kafka.topics.processing-status}")
    private String processingStatusTopic;

    @Value("${kafka.topics.processing-results}")
    private String processingResultsTopic;

    public void sendUploadEvent(UploadEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            String key = generateEventKey(event);
            String topic = selectTopic(event);
            
            CompletableFuture<SendResult<String, String>> future = 
                kafkaTemplate.send(topic, key, eventJson);
            
            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Kafka event sent successfully: topic={}, key={}, partition={}, offset={}", 
                            topic, key, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                } else {
                    log.error("Failed to send Kafka event: topic={}, key={}", topic, key, ex);
                }
            });
            
        } catch (Exception e) {
            log.error("Failed to serialize and send upload event: {}", event, e);
            throw new RuntimeException("Kafka event sending failed", e);
        }
    }

    public void sendProcessingStatusEvent(UploadEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            String key = String.valueOf(event.getUploadId());
            
            kafkaTemplate.send(processingStatusTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Processing status event sent: uploadId={}, status={}", 
                                event.getUploadId(), event.getCurrentStatus());
                    } else {
                        log.error("Failed to send processing status event: uploadId={}", 
                                event.getUploadId(), ex);
                    }
                });
                
        } catch (Exception e) {
            log.error("Failed to send processing status event: {}", event, e);
        }
    }

    public void sendProcessingResultEvent(UploadEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            String key = String.valueOf(event.getUploadId());
            
            kafkaTemplate.send(processingResultsTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Processing result event sent: uploadId={}, status={}", 
                                event.getUploadId(), event.getCurrentStatus());
                    } else {
                        log.error("Failed to send processing result event: uploadId={}", 
                                event.getUploadId(), ex);
                    }
                });
                
        } catch (Exception e) {
            log.error("Failed to send processing result event: {}", event, e);
        }
    }

    private String generateEventKey(UploadEvent event) {
        // 파티셔닝을 위한 키 생성 (uploadId 기반으로 같은 파일의 이벤트들이 같은 파티션에 가도록)
        if (event.getUploadId() != null) {
            return String.valueOf(event.getUploadId());
        } else if (event.getUuid() != null) {
            return event.getUuid();
        } else {
            return event.getEventId();
        }
    }

    private String selectTopic(UploadEvent event) {
        return switch (event.getEventType()) {
            case "UPLOAD_COMPLETED" -> uploadEventsTopic;
            case "PROCESSING_REQUESTED" -> uploadEventsTopic;
            case "STATUS_CHANGED" -> processingStatusTopic;
            default -> uploadEventsTopic;
        };
    }

    // 배치 이벤트 발송 (배치 처리 시작/완료 알림용)
    public void sendBatchEvent(String eventType, Object batchInfo) {
        try {
            String eventJson = objectMapper.writeValueAsString(batchInfo);
            String key = "batch-" + System.currentTimeMillis();
            
            kafkaTemplate.send(processingStatusTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Batch event sent: type={}", eventType);
                    } else {
                        log.error("Failed to send batch event: type={}", eventType, ex);
                    }
                });
                
        } catch (Exception e) {
            log.error("Failed to send batch event: type={}", eventType, e);
        }
    }
}