package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.ai.service.VectorService;
import com.ssafy.lab.orak.processing.exception.AudioProcessingException;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Log4j2
public class VoiceAnalysisJob implements ProcessingJob {

    private final VectorService vectorService;
    private final UploadRepository uploadRepository;
    private final RecordRepository recordRepository;

    @Override
    public boolean process(Upload upload) {
        log.info("음성 분석 처리 시작 - uploadId: {}, 파일명: {}",
                upload.getId(), upload.getOriginalFilename());

        try {
            // 1. 상태를 분석 중으로 변경
            updateStatus(upload, ProcessingStatus.VOICE_ANALYZING);

            // 2. Record 정보 조회 (userId, songId 필요)
            Record record = findRecordByUpload(upload);

            // 3. Python AI 서비스를 통한 음성 분석 수행 (동기)
            log.info("Python AI 서비스 호출 시작 - uploadId: {}, userId: {}, songId: {}",
                    upload.getId(), record.getUserId(), record.getSongId());

            vectorService.processRecordVectorSync(
                record.getUserId(),
                upload.getId(),
                record.getSongId()
            );

            // 4. 음성 분석 완료 상태로 업데이트
            updateStatus(upload, ProcessingStatus.VOICE_ANALYZED);

            log.info("음성 분석 처리 완료 - uploadId: {}, userId: {}, songId: {}",
                    upload.getId(), record.getUserId(), record.getSongId());

            return true;

        } catch (Exception e) {
            log.error("음성 분석 처리 실패 - uploadId: {}", upload.getId(), e);

            // 실패 상태로 업데이트
            try {
                updateStatusWithError(upload, ProcessingStatus.VOICE_ANALYSIS_FAILED, e.getMessage());
            } catch (Exception updateException) {
                log.error("음성 분석 실패 상태 업데이트 중 오류 - uploadId: {}",
                        upload.getId(), updateException);
            }

            return false;
        }
    }

    @Override
    public boolean canProcess(Upload upload) {
        // WAV 변환이 완료된 음성 파일만 처리
        boolean canProcess = upload.isAudioFile() &&
                            upload.getProcessingStatus() == ProcessingStatus.AUDIO_CONVERTED &&
                            hasAssociatedRecord(upload);

        if (!canProcess && upload.isAudioFile()) {
            log.debug("음성 분석 처리 불가 - uploadId: {}, 현재상태: {}, Record존재: {}",
                    upload.getId(),
                    upload.getProcessingStatus(),
                    hasAssociatedRecord(upload));
        }

        return canProcess;
    }

    @Override
    public ProcessingStatus getProcessingStatus() {
        return ProcessingStatus.VOICE_ANALYZING;
    }

    @Override
    public ProcessingStatus getCompletedStatus() {
        return ProcessingStatus.VOICE_ANALYZED;
    }

    @Override
    public int getPriority() {
        return 20; // WAV 변환(10) 이후 낮은 우선순위로 백그라운드 처리
    }

    @Override
    public long getEstimatedProcessingTimeMs(Upload upload) {
        // 파일 크기에 따른 예상 음성 분석 시간 (1MB당 약 30초, 최소 60초)
        long fileSizeMB = upload.getFileSize() / (1024 * 1024);
        return Math.max(60000, fileSizeMB * 30000);
    }

    /**
     * 업로드와 연관된 Record가 있는지 확인 (null 체크 포함)
     */
    private boolean hasAssociatedRecord(Upload upload) {
        if (upload == null || upload.getId() == null) {
            log.warn("Upload 또는 uploadId가 null입니다");
            return false;
        }

        try {
            return recordRepository.existsByUploadId(upload.getId());
        } catch (Exception e) {
            log.error("Record 존재 확인 중 오류 - uploadId: {}", upload.getId(), e);
            return false;
        }
    }

    /**
     * 업로드와 연관된 Record 조회 (null 체크 포함)
     */
    private Record findRecordByUpload(Upload upload) {
        if (upload == null || upload.getId() == null) {
            throw new AudioProcessingException("업로드 정보가 null입니다");
        }

        return recordRepository.findByUploadId(upload.getId())
                .orElseThrow(() -> new AudioProcessingException(
                    "음성 분석을 위한 Record를 찾을 수 없습니다 - uploadId: " + upload.getId()));
    }

    /**
     * 처리 상태 업데이트 (null 체크 포함)
     */
    private void updateStatus(Upload upload, ProcessingStatus status) {
        if (upload == null) {
            log.error("상태 업데이트 실패 - Upload가 null입니다");
            return;
        }
        if (status == null) {
            log.error("상태 업데이트 실패 - ProcessingStatus가 null입니다");
            return;
        }

        upload.setProcessingStatus(status);
        uploadRepository.save(upload);
        log.info("음성 분석 상태 업데이트 - uploadId: {}, 상태: {}", upload.getId(), status);
    }

    /**
     * 에러 메시지와 함께 상태 업데이트 (null 체크 포함)
     */
    private void updateStatusWithError(Upload upload, ProcessingStatus status, String errorMessage) {
        if (upload == null) {
            log.error("에러 상태 업데이트 실패 - Upload가 null입니다");
            return;
        }
        if (status == null) {
            log.error("에러 상태 업데이트 실패 - ProcessingStatus가 null입니다");
            return;
        }

        upload.setProcessingStatus(status);
        upload.setProcessingErrorMessage(errorMessage != null ? errorMessage : "알 수 없는 오류");
        uploadRepository.save(upload);
        log.error("음성 분석 에러 상태 업데이트 - uploadId: {}, 상태: {}, 에러: {}",
                upload.getId(), status, errorMessage);
    }
}