package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Log4j2
public class KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${kafka.topics.upload-events}")
    private String uploadEventsTopic;

    @Value("${kafka.topics.processing-status}")
    private String processingStatusTopic;

    @Value("${kafka.topics.processing-results}")
    private String processingResultsTopic;

    @Value("${kafka.topics.upload-events-retry}")
    private String uploadEventsRetryTopic;

    @Value("${kafka.topics.upload-events-dlq}")
    private String uploadEventsDlqTopic;

    @Value("${kafka.topics.processing-status-dlq}")
    private String processingStatusDlqTopic;

    @Value("${kafka.topics.processing-results-dlq}")
    private String processingResultsDlqTopic;

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
                    log.error("Kafka 이벤트 전송 실패: topic={}, key={}", topic, key, ex);
                }
            });
            
        } catch (Exception e) {
            log.error("업로드 이벤트 직렬화 및 전송 실패: {}", event, e);
            throw new com.ssafy.lab.orak.event.exception.KafkaSendException("Kafka 이벤트 전송 실패", e);
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
                        log.error("처리 상태 이벤트 전송 실패: uploadId={}", 
                                event.getUploadId(), ex);
                    }
                });
                
        } catch (Exception e) {
            log.error("처리 상태 이벤트 전송 실패: {}", event, e);
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
                        log.error("처리 결과 이벤트 전송 실패: uploadId={}", 
                                event.getUploadId(), ex);
                    }
                });
                
        } catch (Exception e) {
            log.error("처리 결과 이벤트 전송 실패: {}", event, e);
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

    public void sendStatusChangeEvent(UploadEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            String key = String.valueOf(event.getUploadId());

            kafkaTemplate.send(processingStatusTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Status change event sent: uploadId={}, status={}→{}",
                                event.getUploadId(), event.getPreviousStatus(), event.getCurrentStatus());
                    } else {
                        log.error("상태 변경 이벤트 전송 실패: uploadId={}",
                                event.getUploadId(), ex);
                    }
                });

        } catch (Exception e) {
            log.error("상태 변경 이벤트 전송 실패: {}", event, e);
        }
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
                        log.error("배치 이벤트 전송 실패: type={}", eventType, ex);
                    }
                });

        } catch (Exception e) {
            log.error("배치 이벤트 전송 실패: type={}", eventType, e);
        }
    }

    // ===============================================
    // DLQ 관련 메서드들
    // ===============================================

    public void sendToRetryTopic(UploadEvent event) {
        try {
            event.incrementRetryCount();
            String eventJson = objectMapper.writeValueAsString(event);
            String key = generateEventKey(event);

            kafkaTemplate.send(uploadEventsRetryTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Event sent to retry topic: uploadId={}, retryCount={}, partition={}, offset={}",
                                event.getUploadId(), event.getRetryCount(),
                                result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                    } else {
                        log.error("재시도 토픽 전송 실패: uploadId={}, retryCount={}",
                                event.getUploadId(), event.getRetryCount(), ex);
                        // 재시도 토픽 실패 시 바로 DLQ로 전송
                        sendToDLQ(event, "Failed to send to retry topic: " + ex.getMessage());
                    }
                });

        } catch (Exception e) {
            log.error("재시도 이벤트 직렬화 실패: {}", event, e);
            sendToDLQ(event, "Serialization failed for retry: " + e.getMessage());
        }
    }

    public void sendToDLQ(UploadEvent event, String errorReason) {
        try {
            event.markForDLQ(errorReason);
            String eventJson = objectMapper.writeValueAsString(event);
            String key = generateEventKey(event);

            kafkaTemplate.send(uploadEventsDlqTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.warn("Event moved to DLQ: uploadId={}, reason={}, partition={}, offset={}",
                                event.getUploadId(), errorReason,
                                result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                    } else {
                        log.error("DLQ 전송도 실패: uploadId={}, 원본 오류={}, DLQ 오류={}",
                                event.getUploadId(), errorReason, ex.getMessage(), ex);
                    }
                });

        } catch (Exception e) {
            log.error("DLQ 이벤트 직렬화 실패 (심각): uploadId={}, 원본 오류={}, 직렬화 오류={}",
                    event.getUploadId(), errorReason, e.getMessage(), e);
        }
    }

    public void sendStatusEventToDLQ(UploadEvent event, String errorReason) {
        try {
            event.markForDLQ(errorReason);
            String eventJson = objectMapper.writeValueAsString(event);
            String key = generateEventKey(event);

            kafkaTemplate.send(processingStatusDlqTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.warn("Status event moved to DLQ: uploadId={}, reason={}",
                                event.getUploadId(), errorReason);
                    } else {
                        log.error("Status DLQ 전송 실패: uploadId={}", event.getUploadId(), ex);
                    }
                });

        } catch (Exception e) {
            log.error("Status DLQ 이벤트 처리 실패: {}", event, e);
        }
    }

    public void sendResultEventToDLQ(UploadEvent event, String errorReason) {
        try {
            event.markForDLQ(errorReason);
            String eventJson = objectMapper.writeValueAsString(event);
            String key = generateEventKey(event);

            kafkaTemplate.send(processingResultsDlqTopic, key, eventJson)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.warn("Result event moved to DLQ: uploadId={}, reason={}",
                                event.getUploadId(), errorReason);
                    } else {
                        log.error("Result DLQ 전송 실패: uploadId={}", event.getUploadId(), ex);
                    }
                });

        } catch (Exception e) {
            log.error("Result DLQ 이벤트 처리 실패: {}", event, e);
        }
    }
}