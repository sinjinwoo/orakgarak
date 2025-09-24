package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.ai.service.VectorService;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.enums.VectorAnalysisStatus;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.event.service.KafkaEventProducer;
import com.ssafy.lab.orak.event.dto.VectorAnalysisRetryEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 벡터 분석 ProcessingJob
 * - WAV 변환이 완료된 오디오 파일의 벡터 분석 처리
 * - EventDrivenProcessingService에서 배치로 실행됨
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VectorAnalysisJob implements ProcessingJob {

    private final VectorService vectorService;
    private final RecordRepository recordRepository;
    private final KafkaEventProducer kafkaEventProducer;

    @Value("${processing.vector-analysis.max-retries:3}")
    private int maxRetries;

    @Override
    public boolean process(Upload upload) {
        log.info("벡터 분석 처리 시작: uploadId={}, filename={}", upload.getId(), upload.getOriginalFilename());

        try {
            // Upload에 연결된 Record 조회
            Record record = recordRepository.findByUploadId(upload.getId());
            if (record == null) {
                log.warn("Upload에 연결된 Record를 찾을 수 없음: uploadId={}", upload.getId());
                return false;
            }

            // 벡터 분석이 필요한지 확인
            if (!record.needsVectorAnalysis()) {
                log.debug("벡터 분석이 불필요함: recordId={}, status={}",
                         record.getId(), record.getVectorAnalysisStatus());
                return true; // 처리 불필요하므로 성공으로 처리
            }

            // 벡터 분석 처리 중 상태로 변경
            record.updateVectorAnalysisStatus(VectorAnalysisStatus.PROCESSING);
            recordRepository.save(record);

            // VectorService의 동기식 벡터 처리 호출
            vectorService.processRecordVectorSync(
                    record.getUserId(),
                    upload.getId(),
                    record.getSongId()
            );

            // 성공 시 상태는 VectorService에서 업데이트됨
            log.info("벡터 분석 처리 완료: uploadId={}, recordId={}", upload.getId(), record.getId());
            return true;

        } catch (VectorService.RetryableProcessingException e) {
            // 재시도 가능한 실패
            log.warn("벡터 분석 재시도 가능한 실패: uploadId={}, error={}", upload.getId(), e.getMessage());
            handleRetryableFailure(upload.getId(), e.getMessage());
            return false;

        } catch (Exception e) {
            // 재시도 불가능한 실패
            log.error("벡터 분석 영구 실패: uploadId={}, error={}", upload.getId(), e.getMessage());
            handlePermanentFailure(upload.getId(), e.getMessage());
            return false;
        }
    }

    @Override
    public boolean canProcess(Upload upload) {
        // WAV 변환이 완료되고, 오디오 파일이며, 분석이 준비된 상태여야 함
        boolean isCompletedWav = upload.getProcessingStatus() == ProcessingStatus.COMPLETED &&
                                 "wav".equalsIgnoreCase(upload.getExtension());

        if (!isCompletedWav) {
            return false;
        }

        // Record 조회해서 벡터 분석이 필요한지 확인
        Record record = recordRepository.findByUploadId(upload.getId());
        return record != null && record.needsVectorAnalysis();
    }

    @Override
    public ProcessingStatus getProcessingStatus() {
        return ProcessingStatus.ANALYZING; // 벡터 분석 중 상태
    }

    @Override
    public ProcessingStatus getCompletedStatus() {
        return ProcessingStatus.COMPLETED; // 완료 상태 유지
    }

    @Override
    public int getPriority() {
        return 2; // WAV 변환(3) 다음으로 높은 우선순위
    }

    @Override
    public long getEstimatedProcessingTimeMs(Upload upload) {
        // 파일 크기에 따른 예상 벡터 분석 시간 (1MB당 약 10초)
        long fileSizeMB = upload.getFileSize() / (1024 * 1024);
        return Math.max(15000, fileSizeMB * 10000); // 최소 15초
    }

    /**
     * 재시도 가능한 실패 처리
     */
    private void handleRetryableFailure(Long uploadId, String errorMessage) {
        try {
            Record record = recordRepository.findByUploadId(uploadId);
            if (record != null) {
                record.markVectorAnalysisRetryableFailure(errorMessage);
                recordRepository.save(record);

                // 최대 재시도 횟수를 초과하지 않았으면 재시도 이벤트 발행
                if (record.getVectorAnalysisRetryCount() < maxRetries) {
                    publishVectorAnalysisRetryEvent(record, errorMessage);
                    log.warn("벡터 분석 재시도 이벤트 발행: recordId={}, retryCount={}/{}",
                             record.getId(), record.getVectorAnalysisRetryCount(), maxRetries);
                } else {
                    // 최대 재시도 횟수 초과
                    record.markVectorAnalysisFailed("최대 재시도 횟수 초과: " + errorMessage);
                    recordRepository.save(record);
                    log.error("벡터 분석 최대 재시도 횟수 초과: recordId={}, retryCount={}/{}",
                             record.getId(), record.getVectorAnalysisRetryCount(), maxRetries);
                }
            }
        } catch (Exception e) {
            log.error("재시도 가능한 실패 처리 중 오류: uploadId={}", uploadId, e);
        }
    }

    /**
     * 재시도 불가능한 실패 처리
     */
    private void handlePermanentFailure(Long uploadId, String errorMessage) {
        try {
            Record record = recordRepository.findByUploadId(uploadId);
            if (record != null) {
                record.markVectorAnalysisFailed("영구 실패: " + errorMessage);
                recordRepository.save(record);
                log.error("벡터 분석 영구 실패 처리: recordId={}, uploadId={}", record.getId(), uploadId);
            }
        } catch (Exception e) {
            log.error("영구 실패 처리 중 오류: uploadId={}", uploadId, e);
        }
    }

    /**
     * 벡터 분석 재시도 이벤트 발행
     */
    private void publishVectorAnalysisRetryEvent(Record record, String errorMessage) {
        try {
            VectorAnalysisRetryEvent retryEvent = VectorAnalysisRetryEvent.createImmediateRetryEvent(
                    record.getId(),
                    record.getUpload().getId(),
                    record.getUserId(),
                    record.getSongId(),
                    record.getVectorAnalysisRetryCount(),
                    maxRetries,
                    errorMessage
            );

            kafkaEventProducer.sendVectorAnalysisRetryEvent(retryEvent);
            log.info("벡터 분석 재시도 이벤트 발행 완료: recordId={}, uploadId={}",
                     record.getId(), record.getUpload().getId());

        } catch (Exception e) {
            log.error("벡터 분석 재시도 이벤트 발행 실패: recordId={}", record.getId(), e);
        }
    }
}