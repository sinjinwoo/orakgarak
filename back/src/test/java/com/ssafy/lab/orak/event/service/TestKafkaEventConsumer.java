package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.processing.service.impl.VoiceAnalysisJob;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
@Log4j2
@Profile("test")
public class TestKafkaEventConsumer {

    private final ObjectMapper objectMapper;
    private final FileUploadService fileUploadService;
    private final EventDrivenProcessingService eventDrivenProcessingService;
    private final KafkaEventProducer kafkaEventProducer;
    private final VoiceAnalysisJob voiceAnalysisJob;

    // 처리 통계
    private final AtomicInteger processedEvents = new AtomicInteger(0);
    private final AtomicInteger failedEvents = new AtomicInteger(0);

    @KafkaListener(topics = "test-upload-events", groupId = "test-consumer-group-upload")
    public void handleUploadEvents(ConsumerRecord<String, String> record) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.info("테스트 업로드 이벤트 처리 중: type={}, uploadId={}, partition={}, offset={}",
                    event.getEventType(), event.getUploadId(), record.partition(), record.offset());

            switch (event.getEventType()) {
                case "UPLOAD_COMPLETED" -> handleUploadCompleted(event);
                case "PROCESSING_REQUESTED" -> handleProcessingRequested(event);
                default -> log.warn("알 수 없는 업로드 이벤트 타입: {}", event.getEventType());
            }

            processedEvents.incrementAndGet();
            log.debug("테스트 업로드 이벤트 처리 완료: {}", event.getEventId());

        } catch (Exception e) {
            log.error("테스트 업로드 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
        }
    }

    @KafkaListener(topics = "test-processing-status", groupId = "test-consumer-group-status")
    public void handleProcessingStatusEvents(ConsumerRecord<String, String> record) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.info("테스트 처리 상태 이벤트 처리 중: uploadId={}, status={}, partition={}, offset={}",
                    event.getUploadId(), event.getCurrentStatus(), record.partition(), record.offset());

            if ("STATUS_CHANGED".equals(event.getEventType())) {
                handleStatusChanged(event);
            }

            processedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("테스트 상태 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
        }
    }

    @KafkaListener(topics = "test-processing-results", groupId = "test-consumer-group-results")
    public void handleProcessingResultEvents(ConsumerRecord<String, String> record) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.info("테스트 처리 결과 이벤트 처리 중: uploadId={}, status={}, partition={}, offset={}",
                    event.getUploadId(), event.getCurrentStatus(), record.partition(), record.offset());

            handleProcessingResult(event);
            processedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("테스트 결과 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
        }
    }

    @KafkaListener(topics = "test-voice-analysis-events", groupId = "test-consumer-group-voice-analysis")
    public void handleVoiceAnalysisEvents(ConsumerRecord<String, String> record) {
        try {
            String eventJson = record.value();
            UploadEvent event = objectMapper.readValue(eventJson, UploadEvent.class);

            log.info("테스트 음성 분석 이벤트 처리 중: uploadId={}, type={}, partition={}, offset={}",
                    event.getUploadId(), event.getEventType(), record.partition(), record.offset());

            if ("VOICE_ANALYSIS_REQUESTED".equals(event.getEventType())) {
                handleVoiceAnalysisRequested(event);
            }

            processedEvents.incrementAndGet();

        } catch (Exception e) {
            log.error("테스트 음성 분석 이벤트 처리 실패: partition={}, offset={}, value={}",
                    record.partition(), record.offset(), record.value(), e);
            failedEvents.incrementAndGet();
        }
    }

    private void handleVoiceAnalysisRequested(UploadEvent event) {
        try {
            if (event.getUploadId() == null) {
                log.warn("음성 분석 이벤트에 uploadId가 없음: {}", event);
                return;
            }

            var upload = fileUploadService.getUpload(event.getUploadId());
            boolean success = voiceAnalysisJob.process(upload);

            if (success) {
                log.info("테스트 음성 분석 처리 성공 - uploadId: {}", event.getUploadId());
            } else {
                log.warn("테스트 음성 분석 처리 실패 - uploadId: {}", event.getUploadId());
                throw new RuntimeException("음성 분석 처리에 실패했습니다");
            }

        } catch (Exception e) {
            log.error("테스트 음성 분석 요청 처리 실패: uploadId={}", event.getUploadId(), e);
            throw e;
        }
    }

    private void handleUploadCompleted(UploadEvent event) {
        try {
            if (event.getUploadId() != null) {
                fileUploadService.updateProcessingStatus(event.getUploadId(), event.getCurrentStatus());
                log.info("테스트 업로드 상태 업데이트 완료 {} for uploadId: {}",
                        event.getCurrentStatus(), event.getUploadId());

                if (Boolean.TRUE.equals(event.getRequiresAudioProcessing()) ||
                    Boolean.TRUE.equals(event.getRequiresImageProcessing())) {

                    eventDrivenProcessingService.requestProcessing(event);
                }
            }
        } catch (Exception e) {
            log.error("테스트 업로드 완료 이벤트 처리 실패: {}", event, e);
        }
    }

    private void handleProcessingRequested(UploadEvent event) {
        try {
            eventDrivenProcessingService.processUploadEvent(event);
        } catch (Exception e) {
            log.error("테스트 처리 요청 이벤트 처리 실패: {}", event, e);
        }
    }

    private void handleStatusChanged(UploadEvent event) {
        try {
            log.info("테스트 업로드 상태 변경: uploadId {}: {} -> {}",
                    event.getUploadId(), event.getPreviousStatus(), event.getCurrentStatus());

            eventDrivenProcessingService.handleStatusChange(event);
        } catch (Exception e) {
            log.error("테스트 상태 변경 처리 실패: {}", event, e);
        }
    }

    private void handleProcessingResult(UploadEvent event) {
        try {
            if (event.getUploadId() != null) {
                if (event.getErrorMessage() != null) {
                    fileUploadService.markProcessingFailed(event.getUploadId(), event.getErrorMessage());
                } else {
                    fileUploadService.updateProcessingStatus(event.getUploadId(), event.getCurrentStatus());
                }

                log.info("테스트 처리 결과 완료: uploadId: {}, finalStatus: {}",
                        event.getUploadId(), event.getCurrentStatus());
            }
        } catch (Exception e) {
            log.error("테스트 처리 결과 처리 실패: {}", event, e);
        }
    }

    public KafkaEventConsumer.ProcessingStatistics getEventProcessingStatistics() {
        return KafkaEventConsumer.ProcessingStatistics.builder()
                .totalProcessed(processedEvents.get())
                .totalFailed(failedEvents.get())
                .successRate(calculateSuccessRate())
                .build();
    }

    private double calculateSuccessRate() {
        int total = processedEvents.get() + failedEvents.get();
        if (total == 0) return 100.0;
        return (double) processedEvents.get() / total * 100.0;
    }
}