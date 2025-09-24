package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.ai.service.VectorService;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 음성 분석 및 벡터 저장 작업
 * - WAV 변환 완료 후 실행
 * - Python AI 서비스를 통한 음성 분석
 * - Pinecone 벡터 DB에 저장
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VectorProcessingJob implements ProcessingJob {

    private final VectorService vectorService;
    private final RecordRepository recordRepository;

    @Override
    public boolean process(Upload upload) {
        log.info("벡터 처리 시작: uploadId={}", upload.getId());

        try {
            // Record 조회 (userId, songId 필요)
            Record record = recordRepository.findByUploadId(upload.getId());
            if (record == null) {
                log.warn("Record를 찾을 수 없음: uploadId={}", upload.getId());
                return false;
            }

            // 동기식 벡터 처리 (Kafka에서 관리하므로)
            vectorService.processRecordVectorSync(
                record.getUserId(),
                upload.getId(),
                record.getSongId()
            );

            log.info("벡터 처리 완료: uploadId={}", upload.getId());
            return true;

        } catch (Exception e) {
            log.error("벡터 처리 실패: uploadId={}", upload.getId(), e);
            return false;
        }
    }

    @Override
    public boolean canProcess(Upload upload) {
        // WAV 변환 완료 후에만 처리
        return upload.isAudioFile() &&
               upload.getProcessingStatus() == ProcessingStatus.COMPLETED;
    }

    @Override
    public ProcessingStatus getProcessingStatus() {
        return ProcessingStatus.ANALYZING; // 새로운 상태 (추가 필요)
    }

    @Override
    public ProcessingStatus getCompletedStatus() {
        return ProcessingStatus.VECTOR_COMPLETED; // 새로운 상태 (추가 필요)
    }

    @Override
    public int getPriority() {
        return 5; // WAV 변환(우선순위 3) 후 실행
    }

    @Override
    public long getEstimatedProcessingTimeMs(Upload upload) {
        // 파일 크기에 따른 예상 음성 분석 시간 (1MB당 약 10초)
        long fileSizeMB = upload.getFileSize() / (1024 * 1024);
        return Math.max(10000, fileSizeMB * 10000); // 최소 10초
    }
}