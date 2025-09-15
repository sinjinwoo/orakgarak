package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
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

    public void publishUploadEvent(UploadEvent event) {
        try {
            // EventBridge로 이벤트 발송
            publishToEventBridge(event);
            
            // Kafka로도 발송 (EventBridge 실패 시 백업 및 로컬 처리용)
            kafkaEventProducer.sendUploadEvent(event);
            
            log.info("Successfully published upload event: {} (uploadId: {})", 
                    event.getEventType(), event.getUploadId());
                    
        } catch (Exception e) {
            log.error("Failed to publish upload event: {}", event, e);
            
            // EventBridge 실패 시 Kafka라도 보내기
            try {
                kafkaEventProducer.sendUploadEvent(event);
                log.info("Fallback: Event sent to Kafka only for uploadId: {}", event.getUploadId());
            } catch (Exception kafkaError) {
                log.error("Critical: Both EventBridge and Kafka failed for event: {}", event, kafkaError);
                throw new RuntimeException("Event publishing completely failed", kafkaError);
            }
        }
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
                log.error("EventBridge failed entries: {}", response.entries());
                throw new RuntimeException("EventBridge failed to process some entries");
            }
            
            log.debug("EventBridge event published successfully: {}", event.getEventId());
            
        } catch (Exception e) {
            log.error("Failed to publish to EventBridge: {}", event, e);
            throw new RuntimeException("EventBridge publishing failed", e);
        }
    }
}