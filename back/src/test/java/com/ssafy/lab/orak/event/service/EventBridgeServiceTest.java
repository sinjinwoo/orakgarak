package com.ssafy.lab.orak.event.service;

import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResponse;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResultEntry;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class EventBridgeServiceTest {

    @Autowired
    private EventBridgeService eventBridgeService;

    @MockitoBean
    private EventBridgeClient eventBridgeClient;

    @MockitoBean
    private KafkaEventProducer kafkaEventProducer;

    private UploadEvent testUploadEvent;

    @BeforeEach
    void setUp() {
        testUploadEvent = UploadEvent.builder()
                .eventId("test-event-123")
                .eventType("UPLOAD_COMPLETED")
                .uploadId(1L)
                .uploaderId(100L)
                .originalFilename("test-audio.mp3")
                .fileSize(1024000L)
                .contentType("audio/mpeg")
                .s3Key("uploads/test-audio.mp3")
                .currentStatus(ProcessingStatus.UPLOADED)
                .requiresAudioProcessing(true)
                .requiresImageProcessing(false)
                .eventTime(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("S3 업로드 완료 이벤트 큐잉 테스트")
    void testSendUploadCompletedEvent() {
        // Given: Kafka Producer Mock 설정
        doNothing().when(kafkaEventProducer).sendUploadEvent(any(UploadEvent.class));

        // When: 업로드 완료 이벤트 큐잉
        boolean success = eventBridgeService.publishUploadEvent(testUploadEvent);

        // Then: 이벤트 큐잉 성공 확인
        assert success;

        // Kafka Producer 호출 확인 (EventBridge는 호출되지 않음)
        verify(kafkaEventProducer, times(1)).sendUploadEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ S3 업로드 완료 이벤트 큐잉 성공");
    }

    @Test
    @DisplayName("처리 상태 변경 이벤트 큐잉 테스트")
    void testSendProcessingStatusChangeEvent() {
        // Given: 상태 변경 이벤트 준비
        UploadEvent statusChangeEvent = testUploadEvent.toBuilder()
                .eventType("STATUS_CHANGED")
                .previousStatus(ProcessingStatus.UPLOADED)
                .currentStatus(ProcessingStatus.PROCESSING)
                .build();

        doNothing().when(kafkaEventProducer).sendStatusChangeEvent(any(UploadEvent.class));

        // When: 상태 변경 이벤트 큐잉
        boolean success = eventBridgeService.publishStatusChangeEvent(statusChangeEvent);

        // Then: 이벤트 큐잉 성공 확인
        assert success;

        verify(kafkaEventProducer, times(1)).sendStatusChangeEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 상태 변경 이벤트 큐잉 성공");
    }

    @Test
    @DisplayName("처리 완료 결과 이벤트 큐잉 테스트")
    void testSendProcessingCompletedEvent() {
        // Given: 처리 완료 이벤트 준비
        UploadEvent completedEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_COMPLETED")
                .currentStatus(ProcessingStatus.COMPLETED)
                .processedS3Key("processed/test-audio-converted.wav")
                .processingDuration(45000L) // 45초
                .build();

        doNothing().when(kafkaEventProducer).sendProcessingResultEvent(any(UploadEvent.class));

        // When: 처리 완료 이벤트 큐잉
        boolean success = eventBridgeService.publishProcessingCompletedEvent(completedEvent);

        // Then: 이벤트 큐잉 성공 확인
        assert success;

        verify(kafkaEventProducer, times(1)).sendProcessingResultEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 완료 결과 이벤트 큐잉 성공");
    }

    @Test
    @DisplayName("처리 실패 이벤트 큐잉 테스트")
    void testSendProcessingFailedEvent() {
        // Given: 처리 실패 이벤트 준비
        UploadEvent failedEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_FAILED")
                .currentStatus(ProcessingStatus.FAILED)
                .errorMessage("Audio conversion failed: Unsupported format")
                .errorCode("CONVERSION_ERROR")
                .build();

        doNothing().when(kafkaEventProducer).sendProcessingResultEvent(any(UploadEvent.class));

        // When: 처리 실패 이벤트 큐잉
        boolean success = eventBridgeService.publishProcessingFailedEvent(failedEvent);

        // Then: 이벤트 큐잉 성공 확인
        assert success;

        verify(kafkaEventProducer, times(1)).sendProcessingResultEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 실패 이벤트 큐잉 성공");
    }

    @Test
    @DisplayName("Kafka 이벤트 큐잉 실패 처리 테스트")
    void testEventBridgeFailureHandling() {
        // Given: Kafka Producer에서 실패하도록 설정
        doThrow(new com.ssafy.lab.orak.event.exception.KafkaSendException("Kafka failed", new RuntimeException("Mock failure")))
                .when(kafkaEventProducer).sendUploadEvent(any(UploadEvent.class));

        // When & Then: 이벤트 큐잉 시도 시 예외 발생 확인
        try {
            eventBridgeService.publishUploadEvent(testUploadEvent);
            assert false : "Expected EventProcessingException to be thrown";
        } catch (com.ssafy.lab.orak.event.exception.EventProcessingException e) {
            // 예상된 예외
            System.out.println("✅ Kafka 이벤트 큐잉 실패 처리 확인 완료");
        }

        verify(kafkaEventProducer, times(1)).sendUploadEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));
    }

    @Test
    @DisplayName("일반 예외 처리 테스트")
    void testEventBridgeExceptionHandling() {
        // Given: Kafka Producer에서 일반 예외 발생
        doThrow(new RuntimeException("Unexpected error"))
                .when(kafkaEventProducer).sendUploadEvent(any(UploadEvent.class));

        // When & Then: 이벤트 큐잉 시도 시 예외 발생 확인
        try {
            eventBridgeService.publishUploadEvent(testUploadEvent);
            assert false : "Expected EventProcessingException to be thrown";
        } catch (com.ssafy.lab.orak.event.exception.EventProcessingException e) {
            // 예상된 예외
            System.out.println("✅ 일반 예외 처리 확인 완료");
        }

        verify(kafkaEventProducer, times(1)).sendUploadEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));
    }

    @Test
    @DisplayName("배치 이벤트 큐잉 테스트")
    void testBatchEventSending() {
        // Given: 여러 개의 이벤트 준비
        java.util.List<UploadEvent> events = java.util.stream.IntStream.range(1, 6)
                .mapToObj(i -> testUploadEvent.toBuilder()
                        .eventId("batch-event-" + i)
                        .uploadId((long) i)
                        .originalFilename("batch-file-" + i + ".mp3")
                        .build())
                .collect(java.util.stream.Collectors.toList());

        doNothing().when(kafkaEventProducer).sendUploadEvent(any(UploadEvent.class));

        // When: 배치 이벤트 큐잉
        boolean success = eventBridgeService.publishBatchEvents(events);

        // Then: 배치 이벤트 큐잉 성공 확인
        assert success;

        verify(kafkaEventProducer, times(5)).sendUploadEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 배치 이벤트 큐잉 성공: " + events.size() + "개 이벤트");
    }

    @Test
    @DisplayName("이벤트 재시도 로직 테스트")
    void testEventRetryLogic() {
        // Given: 처음에는 실패, 두 번째는 성공하는 시나리오
        doThrow(new com.ssafy.lab.orak.event.exception.KafkaSendException("첫 번째 시도 실패", new RuntimeException()))
                .doNothing()
                .when(kafkaEventProducer).sendUploadEvent(any(UploadEvent.class));

        // When: 재시도 로직이 있는 이벤트 큐잉
        boolean success = eventBridgeService.publishUploadEventWithRetry(testUploadEvent, 2);

        // Then: 재시도 후 성공 확인
        assert success;

        verify(kafkaEventProducer, times(2)).sendUploadEvent(any(UploadEvent.class));
        verify(eventBridgeClient, never()).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 이벤트 재시도 로직 확인 완료");
    }
}