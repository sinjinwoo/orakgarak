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
    @DisplayName("S3 업로드 완료 이벤트 발송 테스트")
    void testSendUploadCompletedEvent() {
        // Given: EventBridge 클라이언트 Mock 설정
        PutEventsResponse mockResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .eventId("event-123")
                        .build())
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockResponse);

        // When: 업로드 완료 이벤트 발송
        boolean success = eventBridgeService.publishUploadEvent(testUploadEvent);

        // Then: 이벤트 발송 성공 확인
        assert success;

        // EventBridge 클라이언트 호출 확인
        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ S3 업로드 완료 이벤트 발송 성공");
    }

    @Test
    @DisplayName("처리 상태 변경 이벤트 발송 테스트")
    void testSendProcessingStatusChangeEvent() {
        // Given: 상태 변경 이벤트 준비
        UploadEvent statusChangeEvent = testUploadEvent.toBuilder()
                .eventType("STATUS_CHANGED")
                .previousStatus(ProcessingStatus.UPLOADED)
                .currentStatus(ProcessingStatus.PROCESSING)
                .build();

        PutEventsResponse mockResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .eventId("status-event-456")
                        .build())
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockResponse);

        // When: 상태 변경 이벤트 발송
        boolean success = eventBridgeService.publishStatusChangeEvent(statusChangeEvent);

        // Then: 이벤트 발송 성공 확인
        assert success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 상태 변경 이벤트 발송 성공");
    }

    @Test
    @DisplayName("처리 완료 결과 이벤트 발송 테스트")
    void testSendProcessingCompletedEvent() {
        // Given: 처리 완료 이벤트 준비
        UploadEvent completedEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_COMPLETED")
                .currentStatus(ProcessingStatus.COMPLETED)
                .processedS3Key("processed/test-audio-converted.wav")
                .processingDuration(45000L) // 45초
                .build();

        PutEventsResponse mockResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .eventId("completed-event-789")
                        .build())
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockResponse);

        // When: 처리 완료 이벤트 발송
        boolean success = eventBridgeService.publishProcessingCompletedEvent(completedEvent);

        // Then: 이벤트 발송 성공 확인
        assert success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 완료 결과 이벤트 발송 성공");
    }

    @Test
    @DisplayName("처리 실패 이벤트 발송 테스트")
    void testSendProcessingFailedEvent() {
        // Given: 처리 실패 이벤트 준비
        UploadEvent failedEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_FAILED")
                .currentStatus(ProcessingStatus.FAILED)
                .errorMessage("Audio conversion failed: Unsupported format")
                .errorCode("CONVERSION_ERROR")
                .build();

        PutEventsResponse mockResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .eventId("failed-event-999")
                        .build())
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockResponse);

        // When: 처리 실패 이벤트 발송
        boolean success = eventBridgeService.publishProcessingFailedEvent(failedEvent);

        // Then: 이벤트 발송 성공 확인
        assert success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 처리 실패 이벤트 발송 성공");
    }

    @Test
    @DisplayName("EventBridge 이벤트 발송 실패 처리 테스트")
    void testEventBridgeFailureHandling() {
        // Given: EventBridge 클라이언트에서 실패 응답
        PutEventsResponse mockFailureResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .errorCode("InternalFailure")
                        .errorMessage("Internal service error")
                        .build())
                .failedEntryCount(1)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockFailureResponse);

        // When: 이벤트 발송 시도
        boolean success = eventBridgeService.publishUploadEvent(testUploadEvent);

        // Then: 실패 처리 확인
        assert !success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ EventBridge 이벤트 발송 실패 처리 확인 완료");
    }

    @Test
    @DisplayName("EventBridge 클라이언트 예외 처리 테스트")
    void testEventBridgeExceptionHandling() {
        // Given: EventBridge 클라이언트에서 예외 발생
        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenThrow(new RuntimeException("AWS Service unavailable"));

        // When: 이벤트 발송 시도
        boolean success = eventBridgeService.publishUploadEvent(testUploadEvent);

        // Then: 예외 처리 확인
        assert !success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ EventBridge 클라이언트 예외 처리 확인 완료");
    }

    @Test
    @DisplayName("배치 이벤트 발송 테스트")
    void testBatchEventSending() {
        // Given: 여러 개의 이벤트 준비
        java.util.List<UploadEvent> events = java.util.stream.IntStream.range(1, 6)
                .mapToObj(i -> testUploadEvent.toBuilder()
                        .eventId("batch-event-" + i)
                        .uploadId((long) i)
                        .originalFilename("batch-file-" + i + ".mp3")
                        .build())
                .collect(java.util.stream.Collectors.toList());

        PutEventsResponse mockResponse = PutEventsResponse.builder()
                .entries(events.stream()
                        .map(event -> PutEventsResultEntry.builder()
                                .eventId(event.getEventId())
                                .build())
                        .collect(java.util.stream.Collectors.toList()))
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(mockResponse);

        // When: 배치 이벤트 발송
        boolean success = eventBridgeService.publishBatchEvents(events);

        // Then: 배치 이벤트 발송 성공 확인
        assert success;

        verify(eventBridgeClient, times(1)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 배치 이벤트 발송 성공: " + events.size() + "개 이벤트");
    }

    @Test
    @DisplayName("이벤트 재시도 로직 테스트")
    void testEventRetryLogic() {
        // Given: 처음에는 실패, 두 번째는 성공하는 시나리오
        PutEventsResponse failureResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .errorCode("Throttling")
                        .errorMessage("Request rate exceeded")
                        .build())
                .failedEntryCount(1)
                .build();

        PutEventsResponse successResponse = PutEventsResponse.builder()
                .entries(PutEventsResultEntry.builder()
                        .eventId("retry-success-123")
                        .build())
                .failedEntryCount(0)
                .build();

        when(eventBridgeClient.putEvents(any(PutEventsRequest.class)))
                .thenReturn(failureResponse)
                .thenReturn(successResponse);

        // When: 재시도 로직이 있는 이벤트 발송
        boolean success = eventBridgeService.publishUploadEventWithRetry(testUploadEvent, 2);

        // Then: 재시도 후 성공 확인
        assert success;

        verify(eventBridgeClient, times(2)).putEvents(any(PutEventsRequest.class));

        System.out.println("✅ 이벤트 재시도 로직 확인 완료");
    }
}