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
import com.ssafy.lab.orak.ai.service.VectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Transactional
public class AsyncRecordService {

    private final RecordRepository recordRepository;
    private final PresignedUploadService presignedUploadService;
    private final FileUploadService fileUploadService;
    private final EventBridgeService eventBridgeService;
    private final RecordMapper recordMapper;
    private final VectorService vectorService;


    /**
     * 2단계: S3 업로드 완료 후 이벤트 발생 (웹훅 또는 S3 이벤트 트리거)
     */
    public void handleS3UploadCompleted(Long uploadId, String s3Key) {
        try {
            // Upload 상태를 UPLOADED로 변경
            Upload upload = fileUploadService.getUpload(uploadId);
            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.UPLOADED);

            // EventBridge로 이벤트 발송 (배치 처리 트리거)
            UploadEvent event = UploadEvent.createS3UploadEvent(
                uploadId, upload.getUuid(), s3Key,
                "orakgaraki-bucket", upload.getFileSize(), upload.getContentType()
            );

            boolean eventSent = eventBridgeService.publishUploadEvent(event);

            if (eventSent) {
                log.info("레코딩 업로드 완료 이벤트 발송 성공: uploadId={}", uploadId);
            } else {
                log.error("레코딩 업로드 완료 이벤트 발송 실패: uploadId={}", uploadId);
            }

            // 벡터 DB에 사용자 음성 데이터 저장
            try {
                Record record = recordRepository.findByUploadId(uploadId);
                if (record != null) {
                    vectorService.processRecordVectorAsync(record.getUserId(), uploadId, record.getSongId());
                    log.info("벡터 DB 비동기 저장 요청 완료: uploadId={}", uploadId);
                } else {
                    log.warn("Record를 찾을 수 없어 벡터 저장을 건너뜁니다: uploadId={}", uploadId);
                }
            } catch (Exception e) {
                log.error("벡터 DB 저장 중 오류 발생: uploadId={}", uploadId, e);
            }

        } catch (Exception e) {
            log.error("S3 업로드 완료 처리 실패: uploadId={}", uploadId, e);
            throw new RecordOperationException("S3 업로드 완료 처리에 실패했습니다", e);
        }
    }

    /**
     * 3단계: 배치 처리에서 호출되는 오디오 처리 메서드
     */
    @Transactional
    public void processRecordingAsync(Long uploadId) {
        try {
            log.info("레코딩 비동기 처리 시작: uploadId={}", uploadId);

            // Upload 정보 조회
            Upload upload = fileUploadService.getUpload(uploadId);

            // Record 조회
            Record record = recordRepository.findByUploadId(uploadId);
            if (record == null) {
                log.warn("레코드를 찾을 수 없습니다: uploadId={}", uploadId);
                return;
            }

            // 상태를 PROCESSING으로 변경
            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.PROCESSING);

            // 오디오 변환 처리 (기존 로직 활용)
            // 실제 오디오 변환 로직은 별도 서비스에서 처리
            // 여기서는 시뮬레이션
            simulateAudioProcessing(upload);

            // 처리 완료 상태로 변경
            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.COMPLETED);

            log.info("레코딩 비동기 처리 완료: uploadId={}", uploadId);

        } catch (Exception e) {
            log.error("레코딩 비동기 처리 실패: uploadId={}", uploadId, e);

            // 실패 상태로 변경
            try {
                fileUploadService.markProcessingFailed(uploadId,
                    "오디오 처리 실패: " + e.getMessage());
            } catch (Exception statusUpdateError) {
                log.error("상태 업데이트 실패: uploadId={}", uploadId, statusUpdateError);
            }
            throw new RecordOperationException("레코딩 비동기 처리에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private void simulateAudioProcessing(Upload upload) throws InterruptedException {
        // 실제로는 AudioConverter 등 사용 (duration은 프론트에서 이미 계산됨)
        log.info("오디오 처리 중... uploadId={}", upload.getId());
        Thread.sleep(2000); // 2초 처리 시뮬레이션
        log.info("오디오 처리 완료: uploadId={}", upload.getId());
    }

    @Transactional(readOnly = true)
    public RecordResponseDTO getRecord(Long recordId) {
        Record record = recordRepository.findByIdWithUpload(recordId);
        if (record == null) {
            throw new RecordNotFoundException(recordId);
        }

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
     * 새로운 Record 생성 메서드 (API 분리용)
     * - Upload 검증 후 Record 생성
     * - 즉시 처리 시도 + 실패 시 비동기 처리
     */
    @Transactional
    public RecordResponseDTO createRecord(CreateRecordRequest request, Long userId) {
        try {
            log.info("Record 생성 시작: uploadId={}, title={}, userId={}",
                    request.getUploadId(), request.getTitle(), userId);

            // 1. Upload 존재 및 상태 검증
            Upload upload = validateUploadForRecord(request.getUploadId(), userId);

            // 2. Record 생성
            Record record = Record.builder()
                    .userId(userId)
                    .songId(request.getSongId())
                    .title(request.getTitle())
                    .uploadId(request.getUploadId())
                    .durationSeconds(request.getDurationSeconds())
                    .build();

            Record savedRecord = recordRepository.save(record);
            log.info("Record 저장 완료: recordId={}, uploadId={}", savedRecord.getId(), request.getUploadId());

            // 3. 즉시 처리 시도
            boolean immediateProcessingSuccess = tryImmediateProcessing(upload, savedRecord);

            // 4. ResponseDTO 생성
            RecordResponseDTO response = recordMapper.toResponseDTO(savedRecord, upload);

            if (immediateProcessingSuccess) {
                log.info("Record 즉시 처리 완료: recordId={}", savedRecord.getId());
            } else {
                log.info("Record 비동기 처리 예정: recordId={}", savedRecord.getId());
            }

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
        Record existingRecord = recordRepository.findByUploadId(uploadId);
        if (existingRecord != null) {
            throw new RecordOperationException("이미 Record가 존재하는 업로드입니다: " + uploadId, null);
        }

        return upload;
    }

    /**
     * 즉시 처리 시도
     */
    private boolean tryImmediateProcessing(Upload upload, Record record) {
        try {
            if (upload.getProcessingStatus() == ProcessingStatus.UPLOADED) {
                log.info("즉시 처리 시도: uploadId={}", upload.getId());

                // 동기적으로 처리 (간단한 변환만)
                processRecordingSync(upload.getId());
                return true;
            } else {
                log.info("Upload 상태가 UPLOADED가 아님, 비동기 처리 예정: status={}", upload.getProcessingStatus());
                return false;
            }
        } catch (Exception e) {
            log.warn("즉시 처리 실패, 비동기 처리로 전환: uploadId={}", upload.getId(), e);
            return false;
        }
    }

    /**
     * 동기 처리 (간단한 변환만)
     */
    private void processRecordingSync(Long uploadId) {
        try {
            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.PROCESSING);

            // 빠른 처리 (메타데이터 추출 등)
            Thread.sleep(100); // 실제로는 빠른 변환 작업

            fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.COMPLETED);
            log.info("동기 처리 완료: uploadId={}", uploadId);

        } catch (Exception e) {
            log.error("동기 처리 실패: uploadId={}", uploadId, e);
            throw new RecordOperationException("동기 처리 실패", e);
        }
    }

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