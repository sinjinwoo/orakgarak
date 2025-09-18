package com.ssafy.lab.orak.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.service.EventBridgeService;
import com.ssafy.lab.orak.event.service.KafkaEventConsumer;
import com.ssafy.lab.orak.processing.service.BatchProcessingService;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(
        partitions = 1,
        topics = {"test-upload-events", "test-processing-status", "test-processing-results"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:9092", "port=9092"}
)
@DirtiesContext
class AsyncProcessingPipelineIntegrationTest {

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private BatchProcessingService batchProcessingService;

    @Autowired
    private EventBridgeService eventBridgeService;

    @Autowired
    private KafkaEventConsumer kafkaEventConsumer;

    @Autowired
    private UploadRepository uploadRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("전체 비동기 처리 파이프라인 통합 테스트")
    @Transactional
    void testCompleteAsyncProcessingPipeline() throws Exception {
        // ========================================
        // 1단계: S3 Presigned URL 업로드 시뮬레이션
        // ========================================
        System.out.println("🚀 1단계: S3 업로드 시뮬레이션 시작");

        MockMultipartFile audioFile = new MockMultipartFile(
                "audio",
                "integration-test-audio.mp3",
                "audio/mpeg",
                "test audio content for integration".getBytes()
        );

        Upload uploadedFile = fileUploadService.uploadSingleFile(audioFile, "integration-test", 1L);

        assertThat(uploadedFile.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);
        System.out.println("✅ S3 업로드 완료: " + uploadedFile.getOriginalFilename());

        // ========================================
        // 2단계: EventBridge 이벤트 발송
        // ========================================
        System.out.println("🚀 2단계: EventBridge 이벤트 발송");

        UploadEvent uploadEvent = UploadEvent.builder()
                .eventId("integration-test-event")
                .eventType("UPLOAD_COMPLETED")
                .uploadId(uploadedFile.getId())
                .uploaderId(1L)
                .originalFilename(uploadedFile.getOriginalFilename())
                .fileSize(uploadedFile.getFileSize())
                .contentType(uploadedFile.getContentType())
                .s3Key(uploadedFile.getFullPath())
                .currentStatus(ProcessingStatus.UPLOADED)
                .requiresAudioProcessing(true)
                .requiresImageProcessing(false)
                .eventTime(LocalDateTime.now())
                .build();

        // EventBridge 이벤트 발송 (실제 환경에서는 S3 이벤트가 자동 트리거)
        boolean eventSent = eventBridgeService.publishUploadEvent(uploadEvent);
        assertThat(eventSent).isTrue();
        System.out.println("✅ EventBridge 이벤트 발송 완료");

        // ========================================
        // 3단계: Kafka를 통한 이벤트 처리
        // ========================================
        System.out.println("🚀 3단계: Kafka 이벤트 처리");

        // Kafka로 이벤트 발송 (EventBridge → Kafka 연동 시뮬레이션)
        String eventJson = objectMapper.writeValueAsString(uploadEvent);

        // 실제로는 EventBridge가 Kafka로 전달하지만, 테스트에서는 직접 전송
        try (KafkaProducer<String, String> producer = createTestKafkaProducer()) {
            ProducerRecord<String, String> record = new ProducerRecord<>(
                    "test-upload-events",
                    uploadEvent.getUploadId().toString(),
                    eventJson
            );
            producer.send(record).get(); // 동기적 전송
        }

        System.out.println("✅ Kafka 이벤트 발송 완료");

        // Kafka 이벤트 처리 대기 (Consumer가 처리할 시간 확보)
        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Upload updatedUpload = uploadRepository.findById(uploadedFile.getId()).orElse(null);
            assertThat(updatedUpload).isNotNull();
        });

        // ========================================
        // 4단계: 배치 처리 시스템 동작
        // ========================================
        System.out.println("🚀 4단계: 배치 처리 시작");

        // 배치 처리 실행
        batchProcessingService.processPendingFiles();

        // 배치 처리 완료 대기
        await().atMost(15, TimeUnit.SECONDS).untilAsserted(() -> {
            Upload processedUpload = uploadRepository.findById(uploadedFile.getId()).orElse(null);
            assertThat(processedUpload).isNotNull();
            assertThat(processedUpload.getProcessingStatus())
                    .isIn(ProcessingStatus.PROCESSING, ProcessingStatus.COMPLETED);
        });

        System.out.println("✅ 배치 처리 완료");

        // ========================================
        // 5단계: 처리 결과 검증
        // ========================================
        System.out.println("🚀 5단계: 최종 결과 검증");

        Upload finalUpload = uploadRepository.findById(uploadedFile.getId()).orElse(null);
        assertThat(finalUpload).isNotNull();

        // 처리 상태가 완료되거나 진행 중인지 확인
        assertThat(finalUpload.getProcessingStatus())
                .isIn(ProcessingStatus.PROCESSING, ProcessingStatus.COMPLETED);

        // 통계 확인
        BatchProcessingService.ProcessingStatistics stats =
                batchProcessingService.getStatistics();

        assertThat(stats.getMaxConcurrentJobs()).isGreaterThan(0);

        System.out.println("✅ 전체 파이프라인 테스트 완료!");
        System.out.println("📊 최종 통계:");
        System.out.println("  - 파일 ID: " + finalUpload.getId());
        System.out.println("  - 최종 상태: " + finalUpload.getProcessingStatus());
        System.out.println("  - 활성 작업: " + stats.getActiveJobs());
        System.out.println("  - 최대 동시 작업: " + stats.getMaxConcurrentJobs());
    }

    @Test
    @DisplayName("대용량 파일 동시 처리 파이프라인 테스트")
    @Transactional
    void testHighVolumeAsyncProcessing() throws Exception {
        System.out.println("🚀 대용량 동시 처리 테스트 시작");

        // 여러 파일 동시 업로드
        for (int i = 1; i <= 10; i++) {
            MockMultipartFile audioFile = new MockMultipartFile(
                    "audio" + i,
                    "volume-test-" + i + ".mp3",
                    "audio/mpeg",
                    ("audio content " + i).getBytes()
            );

            Upload upload = fileUploadService.uploadSingleFile(audioFile, "volume-test", 1L);

            // 각 파일에 대한 이벤트 생성 및 발송
            UploadEvent event = UploadEvent.builder()
                    .eventId("volume-event-" + i)
                    .eventType("UPLOAD_COMPLETED")
                    .uploadId(upload.getId())
                    .uploaderId(1L)
                    .originalFilename(upload.getOriginalFilename())
                    .currentStatus(ProcessingStatus.UPLOADED)
                    .requiresAudioProcessing(true)
                    .eventTime(LocalDateTime.now())
                    .build();

            // Kafka로 이벤트 발송
            String eventJson = objectMapper.writeValueAsString(event);
            try (KafkaProducer<String, String> producer = createTestKafkaProducer()) {
                ProducerRecord<String, String> record = new ProducerRecord<>(
                        "test-upload-events",
                        "volume-key-" + i,
                        eventJson
                );
                producer.send(record);
            }
        }

        System.out.println("✅ 10개 파일 업로드 및 이벤트 발송 완료");

        // 배치 처리 여러 번 실행 (동시 처리 제한 테스트)
        for (int round = 1; round <= 3; round++) {
            System.out.println("🔄 배치 처리 라운드 " + round);
            batchProcessingService.processPendingFiles();
            Thread.sleep(2000); // 각 라운드 간 간격
        }

        // 최종 결과 확인
        await().atMost(30, TimeUnit.SECONDS).untilAsserted(() -> {
            long processingOrCompletedCount = uploadRepository.findAll().stream()
                    .mapToLong(upload -> {
                        ProcessingStatus status = upload.getProcessingStatus();
                        return (status == ProcessingStatus.PROCESSING ||
                                status == ProcessingStatus.COMPLETED) ? 1 : 0;
                    })
                    .sum();

            assertThat(processingOrCompletedCount).isGreaterThanOrEqualTo(3); // 최소 3개는 처리되어야 함
        });

        // 통계 확인
        BatchProcessingService.ProcessingStatistics stats =
                batchProcessingService.getStatistics();

        System.out.println("✅ 대용량 처리 테스트 완료!");
        System.out.println("📊 최종 통계:");
        System.out.println("  - 활성 작업: " + stats.getActiveJobs());
        System.out.println("  - 처리 중인 파일: " + stats.getProcessingCount());
        System.out.println("  - 완료된 파일: " + stats.getCompletedCount());
        System.out.println("  - 실패한 파일: " + stats.getFailedCount());
    }

    @Test
    @DisplayName("처리 실패 및 재시도 시나리오 테스트")
    @Transactional
    void testFailureAndRetryScenario() throws Exception {
        System.out.println("🚀 처리 실패 및 재시도 테스트 시작");

        // 실패할 가능성이 있는 파일 업로드
        MockMultipartFile corruptedFile = new MockMultipartFile(
                "corrupted",
                "corrupted-audio.mp3",
                "audio/mpeg",
                "corrupted audio data".getBytes()
        );

        Upload upload = fileUploadService.uploadSingleFile(corruptedFile, "failure-test", 1L);

        // 처리 실패 이벤트 생성
        UploadEvent failureEvent = UploadEvent.builder()
                .eventId("failure-test-event")
                .eventType("PROCESSING_FAILED")
                .uploadId(upload.getId())
                .uploaderId(1L)
                .currentStatus(ProcessingStatus.FAILED)
                .errorMessage("Simulated processing failure")
                .errorCode("TEST_FAILURE")
                .eventTime(LocalDateTime.now())
                .build();

        // 실패 이벤트를 처리 결과 토픽에 발송
        String eventJson = objectMapper.writeValueAsString(failureEvent);
        try (KafkaProducer<String, String> producer = createTestKafkaProducer()) {
            ProducerRecord<String, String> record = new ProducerRecord<>(
                    "test-processing-results",
                    "failure-key",
                    eventJson
            );
            producer.send(record).get();
        }

        // 실패 처리 결과 확인
        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Upload failedUpload = uploadRepository.findById(upload.getId()).orElse(null);
            assertThat(failedUpload).isNotNull();
            assertThat(failedUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.FAILED);
            assertThat(failedUpload.getErrorMessage()).contains("Simulated processing failure");
        });

        System.out.println("✅ 처리 실패 시나리오 확인 완료");

        Upload failedUpload = uploadRepository.findById(upload.getId()).orElse(null);
        System.out.println("📊 실패 정보:");
        System.out.println("  - 상태: " + failedUpload.getProcessingStatus());
        System.out.println("  - 에러 메시지: " + failedUpload.getErrorMessage());
    }

    private KafkaProducer<String, String> createTestKafkaProducer() {
        java.util.Properties props = new java.util.Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("acks", "all");
        return new KafkaProducer<>(props);
    }
}