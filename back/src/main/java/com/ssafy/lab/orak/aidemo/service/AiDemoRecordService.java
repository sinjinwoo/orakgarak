package com.ssafy.lab.orak.aidemo.service;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.mapper.RecordMapper;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class AiDemoRecordService {

    private final RecordRepository recordRepository;
    private final FileUploadService fileUploadService;
    private final RecordMapper recordMapper;
    private final AudioConverter audioConverter;
    private final LocalUploader localUploader;
    private final UploadRepository uploadRepository;

    @Value("${s3.upload.path}")
    private String uploadPath;

    /**
     * 관리자가 특정 사용자에게 AI 데모 파일 업로드 (directory = "ai-cover")
     */
    public RecordResponseDTO createAiDemoRecord(String title, MultipartFile audioFile, Long targetUserId, Long fileSizeBytes, Integer durationSeconds) {
        Upload upload = null;
        try {
            // 1. DTO 생성
            RecordRequestDTO requestDTO = RecordRequestDTO.builder()
                    .title(title)
                    .songId(null) // AI 데모는 특정 곡과 연결되지 않음
                    .audioFile(audioFile)
                    .build();

            // 2. AI 데모 파일 처리 및 업로드 (directory = "ai-cover"로 설정)
            upload = processAndUploadAiDemoFile(audioFile, targetUserId, fileSizeBytes);

            // 3. DB 저장 (트랜잭션 내부) - 클라이언트에서 제공받은 duration 사용
            Record savedRecord = saveAiDemoRecordTransaction(requestDTO, targetUserId, upload, durationSeconds);

            log.info("AI 데모 파일 생성 성공: targetUserId={}, recordId={}", targetUserId, savedRecord.getId());

            // 4. 응답 DTO 반환
            return convertToResponseDTOWithUrl(savedRecord);

        } catch (Exception e) {
            log.error("AI 데모 파일 생성 실패: targetUserId={}", targetUserId, e);

            // 롤백: S3와 DB에서 업로드된 파일 정리
            if (upload != null) {
                try {
                    fileUploadService.deleteFile(upload.getId());
                    log.info("실패한 AI 데모 업로드 파일 정리 완료: uploadId={}", upload.getId());
                } catch (Exception cleanupException) {
                    log.error("AI 데모 업로드 파일 정리 실패: uploadId={}", upload.getId(), cleanupException);
                }
            }

            throw new RecordOperationException("AI 데모 파일 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * AI 데모 파일용 업로드 처리 (directory = "ai-cover")
     */
    private Upload processAndUploadAiDemoFile(MultipartFile audioFile, Long targetUserId, Long fileSizeBytes) {
        try {
            // 1. UUID 생성 (단일 UUID로 통일)
            String uuid = UUID.randomUUID().toString();

            // 2. 로컬 파일 업로드 (UUID와 함께)
            String originalFilePath = localUploader.uploadLocal(audioFile, uuid);

            // 3. 오디오 파일인지 확인하고 WAV 변환
            String contentType = Files.probeContentType(Paths.get(originalFilePath));
            String fileToUpload = originalFilePath;

            if (audioConverter.isAudioFile(audioFile.getOriginalFilename(), contentType)) {
                String wavFilePath = audioConverter.convertToWav(originalFilePath, uploadPath, uuid, audioFile.getOriginalFilename());
                fileToUpload = wavFilePath;
                log.info("AI 데모 파일 WAV 변환 완료: {}", audioFile.getOriginalFilename());
            }

            // 4. S3에 업로드 (directory = "ai-cover"로 설정)
            Upload upload = fileUploadService.uploadLocalFile(fileToUpload, "ai-cover", targetUserId, audioFile.getOriginalFilename());

            // 5. UUID와 클라이언트 제공 file_size로 업데이트
            if (!upload.getUuid().equals(uuid) || !upload.getFileSize().equals(fileSizeBytes)) {
                upload = upload.toBuilder()
                        .uuid(uuid)
                        .fileSize(fileSizeBytes) // 클라이언트가 제공한 파일 크기 사용
                        .build();
                upload = uploadRepository.save(upload);
            }

            // 6. 원본 임시 파일 정리
            cleanupTemporaryFile(originalFilePath);

            return upload;

        } catch (Exception e) {
            log.error("AI 데모 파일 처리 실패: {}", audioFile.getOriginalFilename(), e);
            throw new RecordOperationException("AI 데모 파일 처리에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 특정 사용자의 AI 데모 파일들 조회 (directory = "ai-cover")
     */
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getAiDemoRecords(Long userId) {
        try {
            // 성능 개선: 직접 directory로 필터링하여 N+1 문제 해결
            List<Record> aiDemoRecords = recordRepository.findByUserIdAndUploadDirectoryWithUpload(userId, "ai-cover");
            return convertToResponseDTOsWithUrl(aiDemoRecords);

        } catch (Exception e) {
            log.error("AI 데모 파일 목록 조회 실패: userId={}", userId, e);
            throw new RecordOperationException("AI 데모 파일 목록 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 모든 AI 데모 파일들 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getAllAiDemoRecords() {
        try {
            // 성능 개선: 직접 directory로 필터링하여 N+1 문제 해결
            List<Record> aiDemoRecords = recordRepository.findByUploadDirectoryWithUpload("ai-cover");
            return convertToResponseDTOsWithUrl(aiDemoRecords);

        } catch (Exception e) {
            log.error("전체 AI 데모 파일 목록 조회 실패", e);
            throw new RecordOperationException("AI 데모 파일 목록 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    // ====== Private Helper Methods ======

    private Record saveAiDemoRecordTransaction(RecordRequestDTO requestDTO, Long userId, Upload upload, Integer duration) {
        // Record 엔티티 생성 및 저장 (MapStruct 사용)
        Record record = recordMapper.toEntity(requestDTO, userId, upload);
        record = record.toBuilder().durationSeconds(duration).build();
        return recordRepository.save(record);
    }

    private RecordResponseDTO convertToResponseDTOWithUrl(Record record) {
        Upload upload = fileUploadService.getUpload(record.getUploadId());
        RecordResponseDTO responseDTO = recordMapper.toResponseDTO(record, upload);

        String fileUrl;
        String urlStatus;

        try {
            fileUrl = fileUploadService.getFileUrl(upload);
            urlStatus = "SUCCESS";
            log.debug("AI 데모 파일 URL 생성 성공: uploadId={}", upload.getId());
        } catch (S3UrlGenerationException e) {
            log.warn("AI 데모 S3 Pre-signed URL 생성 실패: uploadId={}, s3Key={}", upload.getId(), e.getS3Key(), e);
            fileUrl = null;
            urlStatus = "FAILED";
        } catch (Exception e) {
            log.warn("AI 데모 파일 URL 생성 중 예상치 못한 오류: uploadId={}", upload.getId(), e);
            fileUrl = null;
            urlStatus = "ERROR";
        }

        return responseDTO.toBuilder()
                .url(fileUrl)
                .urlStatus(urlStatus)
                .build();
    }

    private List<RecordResponseDTO> convertToResponseDTOsWithUrl(List<Record> records) {
        return records.stream()
                .map(this::convertToResponseDTOWithUrl)
                .collect(Collectors.toList());
    }

    private void cleanupTemporaryFile(String filePath) {
        if (filePath == null) return;

        try {
            boolean deleted = Files.deleteIfExists(Paths.get(filePath));
            if (deleted) {
                log.info("AI 데모 임시 파일 삭제 완료: {}", filePath);
            } else {
                log.debug("AI 데모 임시 파일이 이미 존재하지 않음: {}", filePath);
            }
        } catch (Exception e) {
            log.warn("AI 데모 임시 파일 삭제 실패: {} - {}", filePath, e.getMessage());
        }
    }
}