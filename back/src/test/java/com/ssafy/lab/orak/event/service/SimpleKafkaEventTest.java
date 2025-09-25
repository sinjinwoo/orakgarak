package com.ssafy.lab.orak.event.service;

import com.ssafy.lab.orak.event.config.TestKafkaConfig;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import lombok.extern.log4j.Log4j2;
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

@SpringBootTest
@Import(TestKafkaConfig.class)
@EmbeddedKafka(
    partitions = 1,
    topics = {
        "test-upload-events",
        "test-processing-status",
        "test-voice-analysis-events"
    }
)
@ActiveProfiles("test")
@DirtiesContext
@Log4j2
class SimpleKafkaEventTest {

    @Autowired
    private KafkaEventProducer kafkaEventProducer;

    @Autowired
    private TestKafkaEventConsumer testKafkaEventConsumer;

    @MockBean
    private com.ssafy.lab.orak.ai.service.VectorService vectorService;

    @MockBean
    private com.ssafy.lab.orak.s3.helper.S3Helper s3Helper;

    @MockBean
    private com.ssafy.lab.orak.recording.util.AudioConverter audioConverter;

    @Test
    @DisplayName("Kafka 이벤트 발송 및 Consumer 동작 확인")
    void testKafkaEventProducerAndConsumer() throws Exception {
        log.info("=== Kafka 이벤트 발송 및 Consumer 동작 확인 테스트 시작 ===");

        // Given - 테스트 이벤트 생성
        UploadEvent testEvent = UploadEvent.builder()
                .eventId("test-event-id")
                .eventType("UPLOAD_COMPLETED")
                .uploadId(1L)
                .uuid("test-uuid")
                .currentStatus(com.ssafy.lab.orak.upload.enums.ProcessingStatus.UPLOADED)
                .eventTime(LocalDateTime.now())
                .build();

        // When - 여러 이벤트 발송
        for (int i = 0; i < 3; i++) {
            kafkaEventProducer.sendUploadEvent(testEvent);
        }

        log.info("테스트 이벤트 3개 발송 완료");

        // Then - Consumer가 이벤트를 처리했는지 확인
        await()
            .atMost(10, TimeUnit.SECONDS)
            .pollInterval(500, TimeUnit.MILLISECONDS)
            .untilAsserted(() -> {
                var stats = testKafkaEventConsumer.getEventProcessingStatistics();
                log.info("현재 처리 통계 - 성공: {}, 실패: {}", stats.getTotalProcessed(), stats.getTotalFailed());

                assertThat(stats.getTotalProcessed()).isGreaterThanOrEqualTo(3);
            });

        var finalStats = testKafkaEventConsumer.getEventProcessingStatistics();
        assertThat(finalStats.getTotalProcessed()).isGreaterThanOrEqualTo(3);
        assertThat(finalStats.getTotalFailed()).isEqualTo(0);
        assertThat(finalStats.getSuccessRate()).isEqualTo(100.0);

        log.info("=== Kafka 이벤트 발송 및 Consumer 동작 확인 테스트 완료 ===");
        log.info("최종 통계 - 성공: {}, 실패: {}, 성공률: {}%",
                finalStats.getTotalProcessed(), finalStats.getTotalFailed(), finalStats.getSuccessRate());
    }
}