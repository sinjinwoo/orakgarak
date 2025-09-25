package com.ssafy.lab.orak.event.service;

import com.ssafy.lab.orak.event.config.TestKafkaConfig;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Kafka 이벤트 시스템 전용 테스트
 * 이벤트 발송, 수신, DLQ 처리에 집중
 */
@SpringBootTest
@Import(TestKafkaConfig.class)
@EmbeddedKafka(
    partitions = 1,
    topics = {
        "test-upload-events",
        "test-processing-status",
        "test-processing-results",
        "test-voice-analysis-events",
        "test-upload-events-retry",
        "test-upload-events-dlq"
    }
)
@ActiveProfiles("test")
@DirtiesContext
@Log4j2
class KafkaEventTest {

    @Autowired
    private KafkaEventProducer kafkaEventProducer;

    @Autowired
    private TestKafkaEventConsumer testKafkaEventConsumer;

    @Autowired
    private UploadRepository uploadRepository;

    @Autowired
    private RecordRepository recordRepository;

    @MockBean
    private com.ssafy.lab.orak.ai.service.VectorService vectorService;

    @MockBean
    private com.ssafy.lab.orak.s3.helper.S3Helper s3Helper;

    @MockBean
    private com.ssafy.lab.orak.recording.util.AudioConverter audioConverter;

    private Upload testUpload;

    @BeforeEach
    void setUp() {
        log.info("=== Kafka 이벤트 테스트 데이터 준비 ===");

        testUpload = Upload.builder()
                .uuid("kafka-test-uuid")
                .originalFilename("kafka-test.mp3")
                .contentType("audio/mpeg")
                .fileSize(1000000L)
                .extension("mp3")
                .directory("recordings")
                .uploaderId(100L)
                .processingStatus(ProcessingStatus.UPLOADED)
                .build();

        testUpload = uploadRepository.save(testUpload);

        Record testRecord = Record.builder()
                .userId(100L)
                .songId(200L)
                .title("Kafka 테스트 녹음")
                .uploadId(testUpload.getId())
                .build();

        recordRepository.save(testRecord);

        log.info("테스트 데이터 준비 완료 - uploadId: {}", testUpload.getId());
    }

    @Test
    @DisplayName("업로드 이벤트 발송 및 수신 테스트")
    void testUploadEventSendAndReceive() throws Exception {
        log.info("=== 업로드 이벤트 발송/수신 테스트 시작 ===");

        // Given
        UploadEvent uploadEvent = UploadEvent.createS3UploadEvent(
            testUpload.getId(),
            testUpload.getUuid(),
            "recordings/" + testUpload.getStoredFilename(),
            "test-bucket",
            testUpload.getFileSize(),
            testUpload.getContentType()
        );

        // When - 이벤트 발송
        kafkaEventProducer.sendUploadEvent(uploadEvent);
        log.info("업로드 이벤트 발송 완료");

        // Then - 처리 결과 확인
        await()
            .atMost(10, TimeUnit.SECONDS)
            .pollInterval(500, TimeUnit.MILLISECONDS)
            .untilAsserted(() -> {
                Upload updatedUpload = uploadRepository.findById(testUpload.getId()).orElse(null);
                assertThat(updatedUpload).isNotNull();
                log.info("현재 상태: {}", updatedUpload.getProcessingStatus());

                // 처리가 시작되었는지 확인
                assertThat(updatedUpload.getProcessingStatus())
                    .isNotEqualTo(ProcessingStatus.UPLOADED);
            });

        log.info("=== 업로드 이벤트 발송/수신 테스트 완료 ===");
    }

    @Test
    @DisplayName("음성 분석 이벤트 테스트")
    void testVoiceAnalysisEvent() throws Exception {
        log.info("=== 음성 분석 이벤트 테스트 시작 ===");

        // Given - WAV 변환 완료 상태로 설정
        testUpload.updateProcessingStatus(ProcessingStatus.AUDIO_CONVERTED);
        testUpload.setExtension("wav");
        uploadRepository.save(testUpload);

        // When - 음성 분석 이벤트 발송
        kafkaEventProducer.sendVoiceAnalysisEvent(testUpload.getId());
        log.info("음성 분석 이벤트 발송 완료");

        // Then - 음성 분석 처리 확인
        await()
            .atMost(15, TimeUnit.SECONDS)
            .pollInterval(1, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                Upload updatedUpload = uploadRepository.findById(testUpload.getId()).orElse(null);
                assertThat(updatedUpload).isNotNull();
                log.info("음성 분석 상태: {}", updatedUpload.getProcessingStatus());

                // 음성 분석 관련 상태인지 확인
                assertThat(updatedUpload.getProcessingStatus()).isIn(
                    ProcessingStatus.VOICE_ANALYZING,
                    ProcessingStatus.VOICE_ANALYZED
                );
            });

        log.info("=== 음성 분석 이벤트 테스트 완료 ===");
    }

    @Test
    @DisplayName("상태 변경 이벤트 테스트")
    void testStatusChangeEvent() throws Exception {
        log.info("=== 상태 변경 이벤트 테스트 시작 ===");

        // Given
        UploadEvent statusEvent = UploadEvent.createStatusChangeEvent(
            testUpload.getId(),
            testUpload.getUuid(),
            ProcessingStatus.PROCESSING,
            ProcessingStatus.UPLOADED,
            "상태 변경 테스트"
        );

        // When
        kafkaEventProducer.sendStatusChangeEvent(statusEvent);
        log.info("상태 변경 이벤트 발송 완료");

        // Then - 이벤트 처리 대기
        Thread.sleep(2000);

        KafkaEventConsumer.ProcessingStatistics stats = testKafkaEventConsumer.getEventProcessingStatistics();
        assertThat(stats.getTotalProcessed()).isGreaterThan(0);

        log.info("이벤트 처리 통계 - 처리됨: {}, 실패: {}",
                stats.getTotalProcessed(), stats.getTotalFailed());

        log.info("=== 상태 변경 이벤트 테스트 완료 ===");
    }

    @Test
    @DisplayName("DLQ 처리 테스트")
    void testDLQProcessing() throws Exception {
        log.info("=== DLQ 처리 테스트 시작 ===");

        // Given - 잘못된 이벤트 (존재하지 않는 uploadId)
        UploadEvent invalidEvent = UploadEvent.builder()
                .eventId("dlq-test-event")
                .eventType("PROCESSING_REQUESTED")
                .uploadId(999999L) // 존재하지 않는 ID
                .uuid("invalid-uuid")
                .currentStatus(ProcessingStatus.PROCESSING)
                .eventTime(LocalDateTime.now())
                .retryCount(3) // 이미 여러번 재시도함
                .build();

        // When - DLQ로 직접 전송
        kafkaEventProducer.sendToDLQ(invalidEvent, "테스트용 DLQ 전송");
        log.info("DLQ 이벤트 발송 완료");

        // Then - DLQ 처리 확인 (로그로만 확인 가능)
        Thread.sleep(2000);

        log.info("=== DLQ 처리 테스트 완료 ===");
    }

    @Test
    @DisplayName("이벤트 발송 성능 테스트")
    void testEventSendingPerformance() throws Exception {
        log.info("=== 이벤트 발송 성능 테스트 시작 ===");

        // Given - 여러 개의 이벤트 준비
        int eventCount = 10;
        long startTime = System.currentTimeMillis();

        // When - 동시에 여러 이벤트 발송
        for (int i = 0; i < eventCount; i++) {
            UploadEvent event = UploadEvent.createStatusChangeEvent(
                testUpload.getId(),
                testUpload.getUuid() + "-perf-" + i,
                ProcessingStatus.PROCESSING,
                ProcessingStatus.UPLOADED,
                "성능 테스트 이벤트 " + i
            );
            kafkaEventProducer.sendStatusChangeEvent(event);
        }

        // Then - 처리 완료 시간 측정
        Thread.sleep(3000);
        long endTime = System.currentTimeMillis();
        long processingTime = endTime - startTime;

        KafkaEventConsumer.ProcessingStatistics finalStats = testKafkaEventConsumer.getEventProcessingStatistics();

        log.info("성능 테스트 결과 - 이벤트수: {}, 처리시간: {}ms, 평균: {}ms/event",
                eventCount, processingTime, processingTime / eventCount);

        log.info("최종 통계 - 성공: {}, 실패: {}, 성공률: {}%",
                finalStats.getTotalProcessed(), finalStats.getTotalFailed(), finalStats.getSuccessRate());

        // 성능 검증 (평균 500ms 이내)
        assertThat(processingTime / eventCount).isLessThan(500);

        log.info("=== 이벤트 발송 성능 테스트 완료 ===");
    }
}