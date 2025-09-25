package com.ssafy.lab.orak.processing.integration;

import com.ssafy.lab.orak.event.config.TestKafkaConfig;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.service.KafkaEventConsumer;
import com.ssafy.lab.orak.event.service.KafkaEventProducer;
import com.ssafy.lab.orak.event.service.TestKafkaEventConsumer;
import com.ssafy.lab.orak.processing.service.BatchProcessingService;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * 전체 처리 시스템 통합 테스트
 * - Kafka 이벤트 시스템
 * - WAV 변환 + 음성 분석 분리 처리
 * - 재시도 및 상태 관리
 * - DLQ 처리
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
class ProcessingSystemTest {

    @Autowired
    private KafkaEventProducer kafkaEventProducer;

    @Autowired
    private TestKafkaEventConsumer testKafkaEventConsumer;

    @Autowired
    private BatchProcessingService batchProcessingService;

    @Autowired
    private UploadRepository uploadRepository;

    @Autowired
    private RecordRepository recordRepository;

    @MockBean
    private com.ssafy.lab.orak.ai.service.VectorService vectorService;

    private Upload testUpload;
    private Record testRecord;

    @BeforeEach
    void setUp() {
        log.info("=== 처리 시스템 통합 테스트 데이터 준비 ===");

        testUpload = Upload.builder()
                .uuid("test-system-uuid")
                .originalFilename("test-audio.mp3")
                .contentType("audio/mpeg")
                .fileSize(2000000L)
                .extension("mp3")
                .directory("recordings")
                .uploaderId(100L)
                .processingStatus(ProcessingStatus.UPLOADED)
                .build();

        testUpload = uploadRepository.save(testUpload);

        testRecord = Record.builder()
                .userId(100L)
                .songId(200L)
                .title("시스템 테스트 녹음")
                .uploadId(testUpload.getId())
                .build();

        testRecord = recordRepository.save(testRecord);

        log.info("테스트 데이터 준비 완료 - uploadId: {}, recordId: {}",
                testUpload.getId(), testRecord.getId());
    }

    @Test
    @DisplayName("전체 처리 파이프라인 테스트 - 업로드 → WAV 변환 → 음성 분석")
    @Transactional
    void testCompleteProcessingPipeline() throws Exception {
        log.info("=== 전체 처리 파이프라인 테스트 시작 ===");

        // Given - 업로드 완료 이벤트 생성
        UploadEvent uploadEvent = UploadEvent.createS3UploadEvent(
            testUpload.getId(),
            testUpload.getUuid(),
            "recordings/" + testUpload.getStoredFilename(),
            "test-bucket",
            testUpload.getFileSize(),
            testUpload.getContentType()
        );

        // When - 업로드 완료 이벤트 발송
        kafkaEventProducer.sendUploadEvent(uploadEvent);
        log.info("업로드 완료 이벤트 발송 완료");

        // Then - WAV 변환 완료까지 대기
        await()
            .atMost(15, TimeUnit.SECONDS)
            .pollInterval(1, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                Upload updatedUpload = uploadRepository.findById(testUpload.getId()).orElse(null);
                assertThat(updatedUpload).isNotNull();
                log.info("현재 처리 상태: {}", updatedUpload.getProcessingStatus());

                // WAV 변환이 완료되어 재생 가능한 상태인지 확인
                assertThat(updatedUpload.getProcessingStatus()).isIn(
                    ProcessingStatus.AUDIO_CONVERTED,
                    ProcessingStatus.VOICE_ANALYZING,
                    ProcessingStatus.VOICE_ANALYZED,
                    ProcessingStatus.COMPLETED
                );
            });

        // 음성 분석 완료까지 추가 대기
        await()
            .atMost(20, TimeUnit.SECONDS)
            .pollInterval(2, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                Upload finalUpload = uploadRepository.findById(testUpload.getId()).orElse(null);
                assertThat(finalUpload).isNotNull();
                log.info("최종 처리 상태: {}", finalUpload.getProcessingStatus());

                // 최종적으로 모든 처리가 완료되었는지 확인
                assertThat(finalUpload.getProcessingStatus()).isIn(
                    ProcessingStatus.VOICE_ANALYZED,
                    ProcessingStatus.COMPLETED
                );
            });

        log.info("=== 전체 처리 파이프라인 테스트 완료 ===");
    }

    @Test
    @DisplayName("배치 처리 시스템 테스트")
    void testBatchProcessingSystem() throws Exception {
        log.info("=== 배치 처리 시스템 테스트 시작 ===");

        // Given - 처리 대기 상태로 설정
        testUpload.updateProcessingStatus(ProcessingStatus.PENDING);
        uploadRepository.save(testUpload);

        // When - 배치 처리 실행
        batchProcessingService.processPendingFiles();

        // Then - 처리 시작 확인
        await()
            .atMost(10, TimeUnit.SECONDS)
            .pollInterval(1, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                Upload processedUpload = uploadRepository.findById(testUpload.getId()).orElse(null);
                assertThat(processedUpload).isNotNull();
                log.info("배치 처리 후 상태: {}", processedUpload.getProcessingStatus());

                // PENDING 상태가 아닌 처리 상태로 변경되었는지 확인
                assertThat(processedUpload.getProcessingStatus()).isNotEqualTo(ProcessingStatus.PENDING);
            });

        log.info("=== 배치 처리 시스템 테스트 완료 ===");
    }

    @Test
    @DisplayName("재시도 관리 시스템 테스트")
    void testRetryManagementSystem() throws Exception {
        log.info("=== 재시도 관리 시스템 테스트 시작 ===");

        // Given - 실패 상황 시뮬레이션
        testUpload.updateProcessingStatus(ProcessingStatus.AUDIO_CONVERTING);
        testUpload.markRetryableFailure("테스트 실패");
        uploadRepository.save(testUpload);

        assertThat(testUpload.getRetryCount()).isEqualTo(1);
        assertThat(testUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.PENDING);

        // When - 상태 변경 시 재시도 카운터 리셋 테스트
        testUpload.updateProcessingStatus(ProcessingStatus.AUDIO_CONVERTED);

        // Then - 재시도 카운터가 리셋되었는지 확인
        assertThat(testUpload.getRetryCount()).isEqualTo(0);
        assertThat(testUpload.getLastFailedAt()).isNull();

        log.info("=== 재시도 관리 시스템 테스트 완료 ===");
    }

    @Test
    @DisplayName("처리 상태별 재시도 독립성 테스트")
    void testProcessingStatusIndependentRetry() throws Exception {
        log.info("=== 처리 상태별 재시도 독립성 테스트 시작 ===");

        // Given - WAV 변환 실패 3회
        testUpload.updateProcessingStatus(ProcessingStatus.AUDIO_CONVERTING);
        testUpload.markRetryableFailure("WAV 변환 실패 1회");
        testUpload.markRetryableFailure("WAV 변환 실패 2회");
        testUpload.markRetryableFailure("WAV 변환 실패 3회");

        assertThat(testUpload.getRetryCount()).isEqualTo(3);

        // When - WAV 변환 성공 후 음성 분석 시작
        testUpload.updateProcessingStatus(ProcessingStatus.AUDIO_CONVERTED);
        assertThat(testUpload.getRetryCount()).isEqualTo(0); // 리셋 확인

        testUpload.updateProcessingStatus(ProcessingStatus.VOICE_ANALYZING);
        assertThat(testUpload.getRetryCount()).isEqualTo(0); // 여전히 0

        // Then - 음성 분석 실패는 독립적으로 카운트
        testUpload.markRetryableFailure("음성 분석 실패 1회");
        testUpload.markRetryableFailure("음성 분석 실패 2회");

        assertThat(testUpload.getRetryCount()).isEqualTo(2);

        log.info("=== 처리 상태별 재시도 독립성 테스트 완료 ===");
    }

    @Test
    @DisplayName("Kafka 이벤트 처리 통계 테스트")
    void testKafkaEventProcessingStatistics() throws Exception {
        log.info("=== Kafka 이벤트 처리 통계 테스트 시작 ===");

        // Given - 여러 이벤트 발송
        for (int i = 0; i < 5; i++) {
            UploadEvent event = UploadEvent.createStatusChangeEvent(
                testUpload.getId(),
                testUpload.getUuid() + "-" + i,
                ProcessingStatus.PROCESSING,
                ProcessingStatus.UPLOADED,
                "통계 테스트 이벤트 " + i
            );
            kafkaEventProducer.sendStatusChangeEvent(event);
        }

        // When - 처리 완료 대기
        Thread.sleep(3000);

        // Then - 통계 확인
        KafkaEventConsumer.ProcessingStatistics stats = testKafkaEventConsumer.getEventProcessingStatistics();

        assertThat(stats.getTotalProcessed()).isGreaterThanOrEqualTo(5);
        log.info("이벤트 처리 통계 - 성공: {}, 실패: {}, 성공률: {}%",
                stats.getTotalProcessed(), stats.getTotalFailed(), stats.getSuccessRate());

        log.info("=== Kafka 이벤트 처리 통계 테스트 완료 ===");
    }

    @Test
    @DisplayName("시스템 상태 조회 테스트")
    void testSystemStatusInquiry() {
        log.info("=== 시스템 상태 조회 테스트 시작 ===");

        // When - 배치 처리 통계 조회
        BatchProcessingService.ProcessingStatistics stats = batchProcessingService.getStatistics();

        // Then - 통계 데이터 검증
        assertThat(stats).isNotNull();
        assertThat(stats.getActiveJobs()).isGreaterThanOrEqualTo(0);
        assertThat(stats.getMaxConcurrentJobs()).isGreaterThan(0);
        assertThat(stats.isBatchEnabled()).isTrue();

        log.info("배치 처리 통계 - 활성작업: {}/{}, 처리중: {}, 실패: {}, 완료: {}",
                stats.getActiveJobs(), stats.getMaxConcurrentJobs(),
                stats.getProcessingCount(), stats.getFailedCount(), stats.getCompletedCount());

        log.info("=== 시스템 상태 조회 테스트 완료 ===");
    }
}