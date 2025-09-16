package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.exception.EventBridgeSendException;
import com.ssafy.lab.orak.event.exception.KafkaSendException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventBridgeService {

    private final EventBridgeClient eventBridgeClient;
    private final ObjectMapper objectMapper;
    private final KafkaEventProducer kafkaEventProducer;

    @Value("${aws.eventbridge.bus-name}")
    private String eventBusName;

    @Value("${aws.eventbridge.source}")
    private String eventSource;

    @Value("${aws.eventbridge.detail-type}")
    private String detailType;

    public boolean publishUploadEvent(UploadEvent event) {
        try {
            // EventBridge로 이벤트 발송
            publishToEventBridge(event);

            // Kafka로도 발송 (EventBridge 실패 시 백업 및 로컬 처리용)
            kafkaEventProducer.sendUploadEvent(event);

            log.info("업로드 이벤트 발송 성공: {} (uploadId: {})",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (EventBridgeSendException e) {
            log.error("업로드 이벤트 발송 실패: {}", event, e);

            // EventBridge 실패 시 Kafka라도 보내기
            try {
                kafkaEventProducer.sendUploadEvent(event);
                log.info("대체 경로로 Kafka 전송 성공: uploadId={}", event.getUploadId());
                return true;
            } catch (KafkaSendException kafkaError) {
                log.error("심각: EventBridge와 Kafka 모두 실패: {}", event, kafkaError);
                throw new EventBridgeSendException("이벤트 발송에 완전히 실패했습니다", kafkaError);
            }
        } catch (KafkaSendException e) {
            log.error("Kafka 이벤트 발송 실패: {}", event, e);
            throw e;
        }
    }

    public boolean publishStatusChangeEvent(UploadEvent event) {
        try {
            publishToEventBridge(event);
            kafkaEventProducer.sendStatusChangeEvent(event);

            log.info("상태 변경 이벤트 발송 성공: {} (uploadId: {})",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (EventBridgeSendException | KafkaSendException e) {
            log.error("상태 변경 이벤트 발송 실패: {}", event, e);
            throw e;
        }
    }

    public boolean publishProcessingCompletedEvent(UploadEvent event) {
        try {
            publishToEventBridge(event);
            kafkaEventProducer.sendProcessingResultEvent(event);

            log.info("처리 완료 이벤트 발송 성공: {} (uploadId: {})",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (EventBridgeSendException | KafkaSendException e) {
            log.error("처리 완료 이벤트 발송 실패: {}", event, e);
            throw e;
        }
    }

    public boolean publishProcessingFailedEvent(UploadEvent event) {
        try {
            publishToEventBridge(event);
            kafkaEventProducer.sendProcessingResultEvent(event);

            log.info("처리 실패 이벤트 발송 성공: {} (uploadId: {})",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (EventBridgeSendException | KafkaSendException e) {
            log.error("처리 실패 이벤트 발송 실패: {}", event, e);
            throw e;
        }
    }

    public boolean publishBatchEvents(java.util.List<UploadEvent> events) {
        try {
            for (UploadEvent event : events) {
                publishToEventBridge(event);
            }

            log.info("배치 이벤트 발송 성공: {} 개 이벤트", events.size());
            return true;

        } catch (EventBridgeSendException e) {
            log.error("배치 이벤트 발송 실패", e);
            throw e;
        }
    }

    public boolean publishUploadEventWithRetry(UploadEvent event, int maxRetries) {
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                publishToEventBridge(event);
                log.info("이벤트 발송 성공 ({}번째 시도): {}", attempt, event.getEventId());
                return true;

            } catch (EventBridgeSendException e) {
                log.warn("이벤트 발송 실패 ({}번째 시도): {}", attempt, e.getMessage());

                if (attempt == maxRetries) {
                    log.error("모든 재시도 실패 ({}회): {}", maxRetries, event.getEventId());
                    throw new EventBridgeSendException("재시도 횟수 초과로 이벤트 발송 실패: " + event.getEventId(), e);
                }

                // 재시도 전 대기 (백오프)
                try {
                    Thread.sleep(1000 * attempt); // 1초, 2초, 3초...
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new EventBridgeSendException("재시도 중 인터럽트 발생: " + event.getEventId(), ie);
                }
            }
        }
        return false;
    }

    private void publishToEventBridge(UploadEvent event) {
        try {
            String eventDetail = objectMapper.writeValueAsString(event);
            
            // EventBridge 메타데이터 추가
            Map<String, Object> enrichedDetail = new HashMap<>();
            enrichedDetail.put("uploadEvent", event);
            enrichedDetail.put("timestamp", Instant.now().toString());
            enrichedDetail.put("region", "ap-northeast-2");
            enrichedDetail.put("version", "1.0");
            
            String finalDetail = objectMapper.writeValueAsString(enrichedDetail);
            
            PutEventsRequestEntry entry = PutEventsRequestEntry.builder()
                    .source(eventSource)
                    .detailType(detailType)
                    .detail(finalDetail)
                    .eventBusName(eventBusName)
                    .time(Instant.now())
                    .build();

            PutEventsRequest request = PutEventsRequest.builder()
                    .entries(entry)
                    .build();

            var response = eventBridgeClient.putEvents(request);
            
            if (response.failedEntryCount() > 0) {
                log.error("EventBridge 실패한 항목들: {}", response.entries());
                throw new EventBridgeSendException("EventBridge에서 일부 항목 처리 실패");
            }
            
            log.debug("EventBridge 이벤트 발송 성공: {}", event.getEventId());
            
        } catch (EventBridgeSendException e) {
            throw e;
        } catch (Exception e) {
            log.error("EventBridge 발송 실패: {}", event, e);
            throw new EventBridgeSendException("EventBridge 발송 실패: " + e.getMessage(), e);
        }
    }
}