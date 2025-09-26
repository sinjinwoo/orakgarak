package com.ssafy.lab.orak.recording.service;

import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.service.EventBridgeService;
import com.ssafy.lab.orak.recording.dto.CreateRecordRequest;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.mapper.RecordMapper;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.PresignedUploadService;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 비동기 Recording 서비스
 * 1. Presigned URL 생성
 * 2. S3 업로드 완료 시 EventBridge 이벤트 발생
 * 3. 배치 처리로 오디오 변환 및 DB 저장
 */
@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class AsyncRecordService {

    private final RecordRepository recordRepository;
    private final PresignedUploadService presignedUploadService;
    private final FileUploadService fileUploadService;
    private final EventBridgeService eventBridgeService;
    private final RecordMapper recordMapper;


    /**
     * 2단계: S3 업로드 완료 후 이벤트 발생 (웹훅 또는 S3 이벤트 트리거)
     */
    public void handleS3UploadCompleted(Long uploadId, String s3Key) {
        try {
            // Upload 상태를 UPLOADED로 변경
            Upload upload = fileUploadService.getUpload(uploadId);
            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.UPLOADED);

            // EventBridge로 이벤트 발송 (모든 후처리를 Kafka로 통합)
            UploadEvent event = UploadEvent.createS3UploadEvent(
                uploadId, upload.getUuid(), s3Key,
                "orakgaraki-bucket", upload.getFileSize(), upload.getContentType()
            );

            boolean eventSent = eventBridgeService.publishUploadEvent(event);

            if (eventSent) {
                log.info("레코딩 업로드 완료 이벤트 발송 성공: uploadId={} (WAV변환+음성분석 모두 Kafka에서 처리)", uploadId);
            } else {
                log.error("레코딩 업로드 완료 이벤트 발송 실패: uploadId={}", uploadId);
            }

            // 직접 호출 제거 - 이제 모든 처리(WAV 변환 + 음성 분석)가 Kafka ProcessingJob으로 통합됨

        } catch (Exception e) {
            log.error("S3 업로드 완료 처리 실패: uploadId={}", uploadId, e);
            throw new RecordOperationException("S3 업로드 완료 처리에 실패했습니다", e);
        }
    }

    // processRecordingAsync() 제거됨 - 이제 Kafka ProcessingJob들이 모든 처리를 담당

    @Transactional(readOnly = true)
    public RecordResponseDTO getRecord(Long recordId) {
        Record record = recordRepository.findByIdWithUpload(recordId)
                .orElseThrow(() -> new RecordNotFoundException(recordId));

        Upload upload = fileUploadService.getUpload(record.getUploadId());
        return recordMapper.toResponseDTO(record, upload);
    }

    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getRecordsByUser(Long userId) {
        List<Record> records = recordRepository.findByUserIdWithUpload(userId);
        return records.stream()
                .map(record -> {
                    Upload upload = fileUploadService.getUpload(record.getUploadId());
                    return recordMapper.toResponseDTO(record, upload);
                })
                .collect(Collectors.toList());
    }

    /**
     * 새로운 Record 생성 메서드 (현업 패턴: 빠른 응답 + 안전한 백그라운드 처리)
     * - Upload 검증 후 Record 생성 (즉시)
     * - 무거운 처리는 모두 Kafka로 위임
     */
    @Transactional
    public RecordResponseDTO createRecord(CreateRecordRequest request, Long userId) {
        try {
            log.info("Record 생성 시작: uploadId={}, title={}, userId={}",
                    request.getUploadId(), request.getTitle(), userId);

            // 1. Upload 존재 및 상태 검증
            Upload upload = validateUploadForRecord(request.getUploadId(), userId);

            // 2. Record 생성 (즉시)
            Record record = Record.builder()
                    .userId(userId)
                    .songId(request.getSongId())
                    .title(request.getTitle())
                    .uploadId(request.getUploadId())
                    .durationSeconds(request.getDurationSeconds())
                    .build();

            Record savedRecord = recordRepository.save(record);
            log.info("Record 저장 완료: recordId={}, uploadId={}", savedRecord.getId(), request.getUploadId());

            // 3. ResponseDTO 생성 (사용자에게 빠른 피드백)
            RecordResponseDTO response = recordMapper.toResponseDTO(savedRecord, upload);

            // 4. 무거운 처리는 모두 Kafka ProcessingJob들이 백그라운드에서 처리
            log.info("Record 생성 완료, 오디오 처리는 백그라운드에서 진행: recordId={}", savedRecord.getId());

            return response;

        } catch (Exception e) {
            log.error("Record 생성 실패: uploadId={}, title={}",
                    request.getUploadId(), request.getTitle(), e);
            throw new RecordOperationException("Record 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Upload 검증 (존재, 상태, 소유권)
     */
    private Upload validateUploadForRecord(Long uploadId, Long userId) {
        Upload upload = fileUploadService.getUpload(uploadId);
        if (upload == null) {
            throw new RecordOperationException("업로드를 찾을 수 없습니다: " + uploadId, null);
        }

        // 소유권 확인
        if (!upload.getUploaderId().equals(userId)) {
            throw new RecordPermissionDeniedException(null, userId);
        }

        // 이미 Record가 존재하는지 확인
        if (recordRepository.findByUploadId(uploadId).isPresent()) {
            throw new RecordOperationException("이미 Record가 존재하는 업로드입니다: " + uploadId, null);
        }

        return upload;
    }

    // 시뮬레이션 메서드들 제거됨 - 현업 패턴에 따라 모든 처리는 Kafka ProcessingJob으로 통일

    public void deleteRecord(Long recordId, Long userId) {
        try {
            Record record = recordRepository.findById(recordId)
                    .orElseThrow(() -> new RecordNotFoundException(recordId));

            // 권한 확인
            if (!record.getUserId().equals(userId)) {
                throw new RecordPermissionDeniedException(recordId, userId);
            }

            // Record 삭제
            recordRepository.delete(record);

            // 파일 삭제 (S3 + DB)
            fileUploadService.deleteFile(record.getUploadId());

            log.info("레코딩 삭제 완료: recordId={}, userId={}", recordId, userId);

        } catch (Exception e) {
            log.error("레코딩 삭제 실패: recordId={}, userId={}", recordId, userId, e);
            throw e;
        }
    }
}