package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.exception.EventBridgeSendException;
import com.ssafy.lab.orak.event.exception.EventProcessingException;
import com.ssafy.lab.orak.event.exception.KafkaSendException;
import io.micrometer.core.instrument.Counter;
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
    private final Counter kafkaMessagesSentCounter;
    private final Counter kafkaMessagesReceivedCounter;

    @Value("${aws.eventbridge.bus-name}")
    private String eventBusName;

    @Value("${aws.eventbridge.source}")
    private String eventSource;

    @Value("${aws.eventbridge.detail-type}")
    private String detailType;

    /**
     * 업로드 이벤트를 Kafka로 발송
     * 비동기 배치 처리를 위한 이벤트 큐잉
     */
    public boolean publishUploadEvent(UploadEvent event) {
        try {
            kafkaEventProducer.sendUploadEvent(event);
            kafkaMessagesSentCounter.increment();

            log.info("업로드 이벤트 큐잉 완료: eventType={}, uploadId={}",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (KafkaSendException e) {
            log.error("업로드 이벤트 큐잉 실패: uploadId={}, error={}",
                    event.getUploadId(), e.getMessage(), e);
            throw new EventProcessingException("업로드 이벤트 처리 실패", e);
        } catch (Exception e) {
            log.error("업로드 이벤트 처리 중 예상치 못한 오류: uploadId={}",
                    event.getUploadId(), e);
            throw new EventProcessingException("업로드 이벤트 처리 중 시스템 오류 발생", e);
        }
    }

    public boolean publishStatusChangeEvent(UploadEvent event) {
        try {
            kafkaEventProducer.sendStatusChangeEvent(event);

            log.info("상태 변경 이벤트 큐잉 완료: eventType={}, uploadId={}",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (KafkaSendException e) {
            log.error("상태 변경 이벤트 큐잉 실패: uploadId={}, error={}",
                    event.getUploadId(), e.getMessage(), e);
            throw new EventProcessingException("상태 변경 이벤트 처리 실패", e);
        } catch (Exception e) {
            log.error("상태 변경 이벤트 처리 중 예상치 못한 오류: uploadId={}",
                    event.getUploadId(), e);
            throw new EventProcessingException("상태 변경 이벤트 처리 중 시스템 오류 발생", e);
        }
    }

    public boolean publishProcessingCompletedEvent(UploadEvent event) {
        try {
            kafkaEventProducer.sendProcessingResultEvent(event);

            log.info("처리 완료 이벤트 큐잉 완료: eventType={}, uploadId={}",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (KafkaSendException e) {
            log.error("처리 완료 이벤트 큐잉 실패: uploadId={}, error={}",
                    event.getUploadId(), e.getMessage(), e);
            throw new EventProcessingException("처리 완료 이벤트 처리 실패", e);
        } catch (Exception e) {
            log.error("처리 완료 이벤트 처리 중 예상치 못한 오류: uploadId={}",
                    event.getUploadId(), e);
            throw new EventProcessingException("처리 완료 이벤트 처리 중 시스템 오류 발생", e);
        }
    }

    public boolean publishProcessingFailedEvent(UploadEvent event) {
        try {
            kafkaEventProducer.sendProcessingResultEvent(event);

            log.info("처리 실패 이벤트 큐잉 완료: eventType={}, uploadId={}",
                    event.getEventType(), event.getUploadId());
            return true;

        } catch (KafkaSendException e) {
            log.error("처리 실패 이벤트 큐잉 실패: uploadId={}, error={}",
                    event.getUploadId(), e.getMessage(), e);
            throw new EventProcessingException("처리 실패 이벤트 처리 실패", e);
        } catch (Exception e) {
            log.error("처리 실패 이벤트 처리 중 예상치 못한 오류: uploadId={}",
                    event.getUploadId(), e);
            throw new EventProcessingException("처리 실패 이벤트 처리 중 시스템 오류 발생", e);
        }
    }

    public boolean publishBatchEvents(java.util.List<UploadEvent> events) {
        try {
            for (UploadEvent event : events) {
                kafkaEventProducer.sendUploadEvent(event);
            }

            log.info("배치 이벤트 큐잉 완료: {} 개 이벤트", events.size());
            return true;

        } catch (KafkaSendException e) {
            log.error("배치 이벤트 큐잉 실패: eventCount={}, error={}",
                    events.size(), e.getMessage(), e);
            throw new EventProcessingException("배치 이벤트 처리 실패", e);
        } catch (Exception e) {
            log.error("배치 이벤트 처리 중 예상치 못한 오류: eventCount={}",
                    events.size(), e);
            throw new EventProcessingException("배치 이벤트 처리 중 시스템 오류 발생", e);
        }
    }

    public boolean publishUploadEventWithRetry(UploadEvent event, int maxRetries) {
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                kafkaEventProducer.sendUploadEvent(event);
                log.info("이벤트 큐잉 성공 ({}번째 시도): eventId={}", attempt, event.getEventId());
                return true;

            } catch (KafkaSendException e) {
                log.warn("이벤트 큐잉 실패 ({}번째 시도): error={}", attempt, e.getMessage());

                if (attempt == maxRetries) {
                    log.error("모든 재시도 실패 ({}회): eventId={}", maxRetries, event.getEventId());
                    throw new EventProcessingException("재시도 횟수 초과로 이벤트 처리 실패: " + event.getEventId(), e);
                }

                // 재시도 전 대기 (백오프)
                try {
                    Thread.sleep(1000 * attempt); // 1초, 2초, 3초...
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new EventProcessingException("재시도 중 인터럽트 발생: " + event.getEventId(), ie);
                }
            } catch (Exception e) {
                log.error("이벤트 처리 중 예상치 못한 오류 ({}번째 시도): eventId={}",
                        attempt, event.getEventId(), e);
                if (attempt == maxRetries) {
                    throw new EventProcessingException("이벤트 처리 중 시스템 오류 발생", e);
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