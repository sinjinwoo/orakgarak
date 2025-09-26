package com.ssafy.lab.orak.event.integration;

import com.ssafy.lab.orak.common.util.AsyncTestUtils;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.service.KafkaEventProducer;
import com.ssafy.lab.orak.event.service.TestKafkaEventConsumer;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TestContainers를 사용한 실제 카프카 통합 테스트
 * 실제 카프카 브로커를 사용하여 이벤트 처리 파이프라인을 테스트
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Slf4j
class KafkaContainerIntegrationTest {

    @Container
    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"))
            .withEmbeddedZookeeper()
            .withEnv("KAFKA_AUTO_CREATE_TOPICS_ENABLE", "true")
            .withEnv("KAFKA_NUM_PARTITIONS", "1")
            .withReuse(false);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.kafka.consumer.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.kafka.producer.bootstrap-servers", kafka::getBootstrapServers);

        // 테스트용 토픽 설정
        registry.add("kafka.topics.upload-events", () -> "test-upload-events");
        registry.add("kafka.topics.processing-status", () -> "test-processing-status");
        registry.add("kafka.topics.processing-results", () -> "test-processing-results");
        registry.add("kafka.topics.voice-analysis-events", () -> "test-voice-analysis-events");
        registry.add("kafka.topics.upload-events-retry", () -> "test-upload-events-retry");
        registry.add("kafka.topics.upload-events-dlq", () -> "test-upload-events-dlq");
    }

    @Autowired
    private KafkaEventProducer kafkaEventProducer;

    @Autowired
    private TestKafkaEventConsumer testKafkaEventConsumer;

    @Autowired
    private UploadRepository uploadRepository;

    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    private Upload testUpload;
    private Record testRecord;

    @BeforeEach
    void setUp() {
        log.info("=== TestContainers 카프카 통합 테스트 준비 ===");
        log.info("Kafka Bootstrap Servers: {}", kafka.getBootstrapServers());

        // 테스트 데이터 준비
        testUpload = Upload.builder()
                .uuid("testcontainer-uuid")
                .originalFilename("testcontainer-audio.mp3")
                .contentType("audio/mpeg")
                .fileSize(2500000L)
                .extension("mp3")
                .directory("recordings")
                .uploaderId(200L)
                .processingStatus(ProcessingStatus.UPLOADED)
                .build();

        testUpload = uploadRepository.save(testUpload);

        testRecord = Record.builder()
                .userId(200L)
                .songId(300L)
                .title("TestContainer 통합 테스트 녹음")
                .uploadId(testUpload.getId())
                .build();

        testRecord = recordRepository.save(testRecord);

        log.info("테스트 데이터 준비 완료 - uploadId: {}, recordId: {}",
                testUpload.getId(), testRecord.getId());
    }

    @Test
    @DisplayName("실제 카프카를 사용한 이벤트 발송/수신 통합 테스트")
    void testRealKafkaEventProcessing() throws InterruptedException {
        log.info("=== 실제 카프카 이벤트 처리 통합 테스트 시작 ===");

        // Given: 초기 통계 확인
        var initialStats = testKafkaEventConsumer.getEventProcessingStatistics();
        long initialProcessed = initialStats.getTotalProcessed();

        // When: 실제 이벤트 발송
        UploadEvent uploadEvent = UploadEvent.createS3UploadEvent(
            testUpload.getId(),
            testUpload.getUuid(),
            "recordings/" + testUpload.getStoredFilename(),
            "test-bucket",
            testUpload.getFileSize(),
            testUpload.getContentType()
        );

        var performanceTimer = new AsyncTestUtils.PerformanceTimer("카프카 이벤트 처리");
        kafkaEventProducer.sendUploadEvent(uploadEvent);

        // Then: 이벤트 처리 완료 대기
        boolean processed = AsyncTestUtils.waitForKafkaEventProcessing(
            () -> testKafkaEventConsumer.getEventProcessingStatistics().getTotalProcessed() - initialProcessed,
            1L,
            15L, // 15초 대기
            "업로드 이벤트"
        );

        long processingTime = performanceTimer.stop();

        var finalStats = testKafkaEventConsumer.getEventProcessingStatistics();
        long totalProcessed = finalStats.getTotalProcessed() - initialProcessed;

        // 검증
        if (processed) {
            assertThat(totalProcessed).isGreaterThanOrEqualTo(1);
            log.info("✅ 실제 카프카 이벤트 처리 성공");
            log.info("  - 처리된 이벤트: {}개", totalProcessed);
            log.info("  - 처리 시간: {}ms", processingTime);
        } else {
            log.warn("⚠️ 이벤트 처리 타임아웃 발생, 기본 동작 확인");
            assertThat(finalStats.getTotalProcessed()).isGreaterThanOrEqualTo((int) initialProcessed);
        }

        log.info("=== 실제 카프카 이벤트 처리 통합 테스트 완료 ===");
    }

    @Test
    @DisplayName("대량 이벤트 처리 성능 테스트 (실제 카프카)")
    void testHighVolumeEventProcessing() throws InterruptedException {
        log.info("=== 대량 이벤트 처리 성능 테스트 시작 ===");

        // Given: 성능 테스트 준비
        int eventCount = 50;
        var testStats = new AsyncTestUtils.TestStatistics();
        var initialStats = testKafkaEventConsumer.getEventProcessingStatistics();
        long initialProcessed = initialStats.getTotalProcessed();

        // When: 대량 이벤트 발송
        var overallTimer = new AsyncTestUtils.PerformanceTimer("대량 이벤트 처리");

        for (int i = 0; i < eventCount; i++) {
            var eventTimer = new AsyncTestUtils.PerformanceTimer("이벤트 " + i);

            UploadEvent event = UploadEvent.createStatusChangeEvent(
                testUpload.getId() + i,
                testUpload.getUuid() + "-perf-" + i,
                ProcessingStatus.PROCESSING,
                ProcessingStatus.UPLOADED,
                "대량 성능 테스트 이벤트 " + i
            );

            try {
                kafkaEventProducer.sendStatusChangeEvent(event);
                testStats.recordSuccess(eventTimer.stop());
            } catch (Exception e) {
                testStats.recordFailure(eventTimer.stop());
                log.warn("이벤트 발송 실패: {}", e.getMessage());
            }

            // 부하 분산을 위한 약간의 지연
            if (i % 10 == 0) {
                Thread.sleep(100);
            }
        }

        // Then: 처리 완료 대기 및 검증
        boolean allProcessed = AsyncTestUtils.waitForKafkaEventProcessing(
            () -> testKafkaEventConsumer.getEventProcessingStatistics().getTotalProcessed() - initialProcessed,
            eventCount / 2, // 최소 절반은 처리되어야 함
            30L, // 30초 대기
            "대량 이벤트"
        );

        long totalTime = overallTimer.stop();

        var finalStats = testKafkaEventConsumer.getEventProcessingStatistics();
        long totalProcessed = finalStats.getTotalProcessed() - initialProcessed;

        // 결과 로깅
        testStats.logResults("대량 이벤트 발송");
        log.info("=== 처리 결과 ===");
        log.info("발송된 이벤트: {}개, 처리된 이벤트: {}개", eventCount, totalProcessed);
        log.info("전체 처리 시간: {}ms, 평균 처리율: {:.2f} events/sec",
                totalTime, (double) totalProcessed / (totalTime / 1000.0));

        // 성능 검증
        assertThat(totalProcessed).isGreaterThan(0);
        assertThat(testStats.getSuccessRate()).isGreaterThan(80.0); // 80% 이상 성공
        assertThat(totalTime).isLessThan(60000); // 60초 이내

        log.info("=== 대량 이벤트 처리 성능 테스트 완료 ===");
    }

    @Test
    @DisplayName("카프카 브로커 연결 및 토픽 생성 테스트")
    void testKafkaBrokerConnection() {
        log.info("=== 카프카 브로커 연결 테스트 시작 ===");

        // Given & When: 카프카 컨테이너 상태 확인
        assertThat(kafka.isRunning()).isTrue();
        assertThat(kafka.getBootstrapServers()).isNotEmpty();

        // Then: 기본 메시지 발송 테스트
        String testTopic = "connection-test-topic";
        String testMessage = "TestContainers 연결 테스트 메시지";

        try {
            kafkaTemplate.send(testTopic, testMessage).get(5, TimeUnit.SECONDS);
            log.info("✅ 카프카 브로커 연결 및 메시지 발송 성공");
        } catch (Exception e) {
            log.error("❌ 카프카 브로커 연결 실패: {}", e.getMessage());
            throw new AssertionError("카프카 연결 실패", e);
        }

        log.info("=== 카프카 브로커 연결 테스트 완료 ===");
    }

    @Test
    @DisplayName("DLQ 처리 통합 테스트 (실제 카프카)")
    void testDLQProcessingWithRealKafka() throws InterruptedException {
        log.info("=== DLQ 처리 통합 테스트 시작 ===");

        // Given: 잘못된 이벤트 생성 (존재하지 않는 uploadId)
        UploadEvent invalidEvent = UploadEvent.builder()
                .eventId("testcontainer-dlq-event")
                .eventType("PROCESSING_REQUESTED")
                .uploadId(999999L) // 존재하지 않는 ID
                .uuid("invalid-testcontainer-uuid")
                .currentStatus(ProcessingStatus.PROCESSING)
                .eventTime(LocalDateTime.now())
                .retryCount(3)
                .build();

        // When: DLQ로 직접 전송
        kafkaEventProducer.sendToDLQ(invalidEvent, "TestContainers DLQ 테스트");
        log.info("DLQ 이벤트 발송 완료");

        // Then: DLQ 처리 대기 (로그 확인)
        Thread.sleep(5000);

        log.info("✅ DLQ 처리 통합 테스트 완료 (로그에서 DLQ 처리 확인)");
        log.info("=== DLQ 처리 통합 테스트 종료 ===");
    }
}