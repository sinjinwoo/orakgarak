package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Log4j2
public class DLQConsumer {

    private final ObjectMapper objectMapper;
    private final FileUploadService fileUploadService;
    private final KafkaEventProducer kafkaEventProducer;

    // DLQ 처리 통계
    private final AtomicInteger dlqProcessedEvents = new AtomicInteger(0);
    private final AtomicInteger dlqFailedEvents = new AtomicInteger(0);

    // ===============================================
    // 업로드 이벤트 DLQ Consumer
    // ===============================================

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.upload-events-dlq')}",
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-dlq")
    public void handleUploadEventsDLQ(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.error("DLQ 이벤트 처리: uploadId={}, originalError={}, dlqTime={}, partition={}, offset={}",
                    event.getUploadId(), event.getErrorMessage(), event.getDlqTimestamp(),
                    record.partition(), record.offset());

            // DLQ에 온 이벤트들은 DB에 최종 실패 상태로 저장
            if (event.getUploadId() != null) {
                String finalErrorMessage = String.format("DLQ: %s (재시도 %d회 실패)",
                        event.getErrorMessage(), event.getRetryCount());

                fileUploadService.markProcessingFailed(event.getUploadId(), finalErrorMessage);

                log.error("파일 처리 최종 실패로 기록: uploadId={}, filename={}, error={}",
                        event.getUploadId(), event.getOriginalFilename(), finalErrorMessage);
            }

            // DLQ 모니터링을 위한 알림 (선택적)
            sendDLQNotification(event, "UPLOAD_EVENT_DLQ");

            ack.acknowledge();
            dlqProcessedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("DLQ 이벤트 처리조차 실패 (심각): partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            dlqFailedEvents.incrementAndGet();

            // DLQ 처리도 실패한 경우에는 그냥 ACK (무한루프 방지)
            ack.acknowledge();
        }
    }

    // ===============================================
    // 처리 상태 DLQ Consumer
    // ===============================================

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.processing-status-dlq')}",
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-status-dlq")
    public void handleProcessingStatusDLQ(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.error("처리 상태 DLQ: uploadId={}, status={}, error={}, partition={}, offset={}",
                    event.getUploadId(), event.getCurrentStatus(), event.getErrorMessage(),
                    record.partition(), record.offset());

            // 상태 변경 이벤트 실패는 일반적으로 치명적이지 않으므로 로그만 남김
            sendDLQNotification(event, "STATUS_EVENT_DLQ");

            ack.acknowledge();
            dlqProcessedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("상태 DLQ 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            dlqFailedEvents.incrementAndGet();
            ack.acknowledge();
        }
    }

    // ===============================================
    // 처리 결과 DLQ Consumer
    // ===============================================

    @KafkaListener(topics = "#{@environment.getProperty('kafka.topics.processing-results-dlq')}",
                   groupId = "#{@environment.getProperty('spring.kafka.consumer.group-id')}-results-dlq")
    public void handleProcessingResultsDLQ(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.error("처리 결과 DLQ: uploadId={}, finalStatus={}, error={}, partition={}, offset={}",
                    event.getUploadId(), event.getCurrentStatus(), event.getErrorMessage(),
                    record.partition(), record.offset());

            // 처리 결과 저장 실패도 DB에 기록
            if (event.getUploadId() != null) {
                String errorMessage = String.format("Result processing failed: %s", event.getErrorMessage());
                fileUploadService.markProcessingFailed(event.getUploadId(), errorMessage);
            }

            sendDLQNotification(event, "RESULT_EVENT_DLQ");

            ack.acknowledge();
            dlqProcessedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("결과 DLQ 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            dlqFailedEvents.incrementAndGet();
            ack.acknowledge();
        }
    }

    // ===============================================
    // DLQ 알림 및 모니터링
    // ===============================================

    private void sendDLQNotification(UploadEvent event, String dlqType) {
        try {
            DLQNotification notification = DLQNotification.builder()
                    .dlqType(dlqType)
                    .uploadId(event.getUploadId())
                    .originalFilename(event.getOriginalFilename())
                    .errorMessage(event.getErrorMessage())
                    .retryCount(event.getRetryCount())
                    .dlqTimestamp(event.getDlqTimestamp())
                    .eventId(event.getEventId())
                    .build();

            // 모니터링 시스템이나 알림 채널로 전송 (예: Slack, Mattermost 등)
            log.warn("DLQ 알림: type={}, uploadId={}, filename={}, error={}",
                    dlqType, event.getUploadId(), event.getOriginalFilename(), event.getErrorMessage());

            // 실제 구현에서는 알림 서비스로 전송
            // notificationService.sendDLQAlert(notification);

        } catch (Exception e) {
            log.error("DLQ 알림 전송 실패: {}", event, e);
        }
    }

    // ===============================================
    // DLQ 수동 복구 메서드 (관리자용)
    // ===============================================

    public void retryFromDLQ(Long uploadId) {
        try {
            log.info("DLQ에서 수동 재시도 요청: uploadId={}", uploadId);

            // 해당 uploadId의 정보를 DB에서 조회
            var upload = fileUploadService.findById(uploadId);
            if (upload == null) {
                log.warn("수동 재시도 실패 - Upload not found: uploadId={}", uploadId);
                return;
            }

            // 새로운 이벤트 생성하여 재시도 토픽으로 전송
            UploadEvent retryEvent = UploadEvent.builder()
                    .eventId(java.util.UUID.randomUUID().toString())
                    .eventType("RETRY_PROCESSING")
                    .source("manual_dlq_retry")
                    .uploadId(uploadId)
                    .uuid(upload.getUuid())
                    .s3Key(upload.getFullPath())
                    .originalFilename(upload.getOriginalFilename())
                    .contentType(upload.getContentType())
                    .requiresAudioProcessing(upload.getContentType() != null && upload.getContentType().startsWith("audio/"))
                    .requiresImageProcessing(upload.getContentType() != null && upload.getContentType().startsWith("image/"))
                    .eventTime(LocalDateTime.now())
                    .retryReason("Manual retry from DLQ")
                    .retryCount(0) // 수동 재시도는 카운트 리셋
                    .build();

            kafkaEventProducer.sendToRetryTopic(retryEvent);

            log.info("DLQ 수동 재시도 완료: uploadId={}, eventId={}", uploadId, retryEvent.getEventId());

        } catch (Exception e) {
            log.error("DLQ 수동 재시도 실패: uploadId={}", uploadId, e);
        }
    }

    // ===============================================
    // DLQ 통계 조회
    // ===============================================

    public DLQStatistics getDLQStatistics() {
        return DLQStatistics.builder()
                .totalDLQProcessed(dlqProcessedEvents.get())
                .totalDLQFailed(dlqFailedEvents.get())
                .dlqProcessingRate(calculateDLQProcessingRate())
                .build();
    }

    private double calculateDLQProcessingRate() {
        int total = dlqProcessedEvents.get() + dlqFailedEvents.get();
        if (total == 0) return 100.0;
        return (double) dlqProcessedEvents.get() / total * 100.0;
    }

    // ===============================================
    // Data Classes
    // ===============================================

    @lombok.Builder
    @lombok.Data
    public static class DLQNotification {
        private String dlqType;
        private Long uploadId;
        private String originalFilename;
        private String errorMessage;
        private Integer retryCount;
        private LocalDateTime dlqTimestamp;
        private String eventId;
    }

    @lombok.Builder
    @lombok.Data
    public static class DLQStatistics {
        private int totalDLQProcessed;
        private int totalDLQFailed;
        private double dlqProcessingRate;
    }
}