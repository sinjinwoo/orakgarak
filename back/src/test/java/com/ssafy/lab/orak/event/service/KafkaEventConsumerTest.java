package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "kafka.topics.upload-events=test-upload-events",
        "kafka.topics.processing-status=test-processing-status",
        "kafka.topics.processing-results=test-processing-results"
})
class KafkaEventConsumerTest {

    @Autowired
    private KafkaEventConsumer kafkaEventConsumer;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FileUploadService fileUploadService;

    @MockitoBean
    private EventDrivenProcessingService eventDrivenProcessingService;

    @MockitoBean
    private Acknowledgment acknowledgment;

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
    @DisplayName("업로드 완료 이벤트 처리 테스트")
    void testHandleUploadCompletedEvent() throws Exception {
        // Given: 업로드 완료 이벤트 JSON 준비
        String eventJson = objectMapper.writeValueAsString(testUploadEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-upload-events", 0, 0L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleUploadEvents(record, acknowledgment);

        // Then: 파일 업로드 서비스 호출 확인
        verify(fileUploadService, times(1))
                .updateProcessingStatus(eq(1L), eq(ProcessingStatus.UPLOADED));

        // 오디오 처리가 필요한 경우 처리 요청 확인
        verify(eventDrivenProcessingService, times(1))
                .requestProcessing(any(UploadEvent.class));

        // ACK 확인
        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 업로드 완료 이벤트 처리 성공");
    }

    @Test
    @DisplayName("처리 요청 이벤트 처리 테스트")
    void testHandleProcessingRequestedEvent() throws Exception {
        // Given: 처리 요청 이벤트 준비
        UploadEvent processingEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_REQUESTED")
                .build();

        String eventJson = objectMapper.writeValueAsString(processingEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-upload-events", 0, 1L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleUploadEvents(record, acknowledgment);

        // Then: 이벤트 기반 처리 서비스 호출 확인
        verify(eventDrivenProcessingService, times(1))
                .processUploadEvent(any(UploadEvent.class));

        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 처리 요청 이벤트 처리 성공");
    }

    @Test
    @DisplayName("상태 변경 이벤트 처리 테스트")
    void testHandleStatusChangeEvent() throws Exception {
        // Given: 상태 변경 이벤트 준비
        UploadEvent statusChangeEvent = testUploadEvent.toBuilder()
                .eventType("STATUS_CHANGED")
                .previousStatus(ProcessingStatus.UPLOADED)
                .currentStatus(ProcessingStatus.PROCESSING)
                .build();

        String eventJson = objectMapper.writeValueAsString(statusChangeEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-processing-status", 0, 0L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleProcessingStatusEvents(record, acknowledgment);

        // Then: 상태 변경 처리 확인
        verify(eventDrivenProcessingService, times(1))
                .handleStatusChange(any(UploadEvent.class));

        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 상태 변경 이벤트 처리 성공");
    }

    @Test
    @DisplayName("처리 결과 성공 이벤트 처리 테스트")
    void testHandleProcessingResultSuccessEvent() throws Exception {
        // Given: 처리 성공 결과 이벤트 준비
        UploadEvent resultEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_COMPLETED")
                .currentStatus(ProcessingStatus.COMPLETED)
                .processedS3Key("processed/test-audio-converted.wav")
                .processingDuration(45000L)
                .build();

        String eventJson = objectMapper.writeValueAsString(resultEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-processing-results", 0, 0L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleProcessingResultEvents(record, acknowledgment);

        // Then: 성공 처리 확인
        verify(fileUploadService, times(1))
                .updateProcessingStatus(eq(1L), eq(ProcessingStatus.COMPLETED));

        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 처리 결과 성공 이벤트 처리 성공");
    }

    @Test
    @DisplayName("처리 결과 실패 이벤트 처리 테스트")
    void testHandleProcessingResultFailureEvent() throws Exception {
        // Given: 처리 실패 결과 이벤트 준비
        UploadEvent failureEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_FAILED")
                .currentStatus(ProcessingStatus.FAILED)
                .errorMessage("Audio conversion failed: Unsupported format")
                .errorCode("CONVERSION_ERROR")
                .build();

        String eventJson = objectMapper.writeValueAsString(failureEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-processing-results", 0, 1L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleProcessingResultEvents(record, acknowledgment);

        // Then: 실패 처리 확인
        verify(fileUploadService, times(1))
                .markProcessingFailed(eq(1L), eq("Audio conversion failed: Unsupported format"));

        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 처리 결과 실패 이벤트 처리 성공");
    }

    @Test
    @DisplayName("잘못된 JSON 이벤트 처리 테스트")
    void testHandleInvalidJsonEvent() {
        // Given: 잘못된 JSON 이벤트
        String invalidJson = "{ invalid json format }";
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-upload-events", 0, 0L, "key", invalidJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleUploadEvents(record, acknowledgment);

        // Then: 파일 업로드 서비스 호출되지 않음
        verify(fileUploadService, never()).updateProcessingStatus(any(), any());

        // 예외 발생 시에도 ACK 처리 확인
        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 잘못된 JSON 이벤트 처리 확인 완료");
    }

    @Test
    @DisplayName("알 수 없는 이벤트 타입 처리 테스트")
    void testHandleUnknownEventType() throws Exception {
        // Given: 알 수 없는 이벤트 타입
        UploadEvent unknownEvent = testUploadEvent.toBuilder()
                .eventType("UNKNOWN_EVENT_TYPE")
                .build();

        String eventJson = objectMapper.writeValueAsString(unknownEvent);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "test-upload-events", 0, 0L, "key", eventJson);

        // When: 이벤트 처리
        kafkaEventConsumer.handleUploadEvents(record, acknowledgment);

        // Then: 특별한 처리 없이 ACK만 확인
        verify(fileUploadService, never()).updateProcessingStatus(any(), any());
        verify(eventDrivenProcessingService, never()).processUploadEvent(any());

        verify(acknowledgment, times(1)).acknowledge();

        System.out.println("✅ 알 수 없는 이벤트 타입 처리 확인 완료");
    }

    @Test
    @DisplayName("이벤트 처리 통계 확인 테스트")
    void testEventProcessingStatistics() throws Exception {
        // Given: 여러 이벤트 처리
        for (int i = 0; i < 5; i++) {
            UploadEvent event = testUploadEvent.toBuilder()
                    .eventId("test-event-" + i)
                    .uploadId((long) i)
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);
            ConsumerRecord<String, String> record = new ConsumerRecord<>(
                    "test-upload-events", 0, (long) i, "key", eventJson);

            kafkaEventConsumer.handleUploadEvents(record, acknowledgment);
        }

        // 잘못된 JSON 이벤트도 하나 처리
        ConsumerRecord<String, String> badRecord = new ConsumerRecord<>(
                "test-upload-events", 0, 5L, "key", "{ bad json }");
        kafkaEventConsumer.handleUploadEvents(badRecord, acknowledgment);

        // When: 통계 조회
        KafkaEventConsumer.ProcessingStatistics stats =
                kafkaEventConsumer.getEventProcessingStatistics();

        // Then: 통계 확인
        assert stats.getTotalProcessed() == 5; // 성공한 이벤트 수
        assert stats.getTotalFailed() == 1;    // 실패한 이벤트 수
        assert stats.getSuccessRate() > 80.0;  // 성공률

        System.out.println("✅ 이벤트 처리 통계 확인 완료");
        System.out.println("  - 처리 성공: " + stats.getTotalProcessed());
        System.out.println("  - 처리 실패: " + stats.getTotalFailed());
        System.out.println("  - 성공률: " + String.format("%.1f%%", stats.getSuccessRate()));
    }

    @Test
    @DisplayName("컨슈머 그룹별 병렬 처리 테스트")
    void testParallelConsumerGroupProcessing() throws Exception {
        // Given: 다양한 토픽의 이벤트 준비
        UploadEvent uploadEvent = testUploadEvent.toBuilder()
                .eventType("UPLOAD_COMPLETED")
                .build();

        UploadEvent statusEvent = testUploadEvent.toBuilder()
                .eventType("STATUS_CHANGED")
                .previousStatus(ProcessingStatus.UPLOADED)
                .currentStatus(ProcessingStatus.PROCESSING)
                .build();

        UploadEvent resultEvent = testUploadEvent.toBuilder()
                .eventType("PROCESSING_COMPLETED")
                .currentStatus(ProcessingStatus.COMPLETED)
                .build();

        // When: 각 토픽별 이벤트 처리 (병렬 처리 시뮬레이션)
        String uploadEventJson = objectMapper.writeValueAsString(uploadEvent);
        String statusEventJson = objectMapper.writeValueAsString(statusEvent);
        String resultEventJson = objectMapper.writeValueAsString(resultEvent);

        ConsumerRecord<String, String> uploadRecord = new ConsumerRecord<>(
                "test-upload-events", 0, 0L, "key", uploadEventJson);
        ConsumerRecord<String, String> statusRecord = new ConsumerRecord<>(
                "test-processing-status", 0, 0L, "key", statusEventJson);
        ConsumerRecord<String, String> resultRecord = new ConsumerRecord<>(
                "test-processing-results", 0, 0L, "key", resultEventJson);

        kafkaEventConsumer.handleUploadEvents(uploadRecord, acknowledgment);
        kafkaEventConsumer.handleProcessingStatusEvents(statusRecord, acknowledgment);
        kafkaEventConsumer.handleProcessingResultEvents(resultRecord, acknowledgment);

        // Then: 각 컨슈머 그룹별 처리 확인
        verify(fileUploadService, times(2)).updateProcessingStatus(any(), any());
        verify(eventDrivenProcessingService, times(1)).requestProcessing(any());
        verify(eventDrivenProcessingService, times(1)).handleStatusChange(any());

        verify(acknowledgment, times(3)).acknowledge();

        System.out.println("✅ 컨슈머 그룹별 병렬 처리 확인 완료");
    }
}