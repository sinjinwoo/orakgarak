package com.ssafy.lab.orak.recording.service;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.mapper.RecordMapper;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.recording.util.AudioDurationCalculator;
import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import com.ssafy.lab.orak.ai.service.VectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
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
public class RecordService {
    
    private final RecordRepository recordRepository;
    private final FileUploadService fileUploadService;
    private final RecordMapper recordMapper;
    private final AudioConverter audioConverter;
    private final AudioDurationCalculator audioDurationCalculator;
    private final LocalUploader localUploader;
    private final UploadRepository uploadRepository;
    
    @Value("${s3.upload.path}")
    private String uploadPath;
    
    public RecordResponseDTO createRecord(String title, Long songId, MultipartFile audioFile, Long userId) {
        Upload upload = null;
        try {
            // 1. DTO 생성
            RecordRequestDTO requestDTO = RecordRequestDTO.builder()
                    .title(title)
                    .songId(songId)
                    .audioFile(audioFile)
                    .build();
            
            // 2. 파일 처리 및 업로드 (트랜잭션 외부에서 처리)
            upload = processAndUploadAudioFile(audioFile, userId);
            Integer calculatedDuration = audioDurationCalculator.calculateDurationInSeconds(
                uploadPath + "/" + upload.getStoredFilename()
            );
            
            // 3. DB 저장 (트랜잭션 내부)
            Record savedRecord = saveRecordTransaction(requestDTO, userId, upload, calculatedDuration);
            
            log.info("녹음 파일 생성 성공: userId={}, recordId={}", userId, savedRecord.getId());
            
            // 4. 응답 DTO 반환
            return convertToResponseDTOWithUrl(savedRecord);
            
        } catch (Exception e) {
            log.error("녹음 파일 생성 실패: userId={}", userId, e);
            
            // 롤백: S3와 DB에서 업로드된 파일 정리
            if (upload != null) {
                try {
                    fileUploadService.deleteFile(upload.getId());
                    log.info("실패한 업로드 파일 정리 완료: uploadId={}", upload.getId());
                } catch (Exception cleanupException) {
                    log.error("업로드 파일 정리 실패: uploadId={}", upload.getId(), cleanupException);
                }
            }
            
            throw new RecordOperationException("녹음 파일 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    private Record saveRecordTransaction(RecordRequestDTO requestDTO, Long userId, Upload upload, Integer duration) {
        // Record 엔티티 생성 및 저장 (MapStruct 사용)
        Record record = recordMapper.toEntity(requestDTO, userId, upload);
        record = record.toBuilder().durationSeconds(duration).build();
        return recordRepository.save(record);
    }
    
    @Transactional(readOnly = true)
    public RecordResponseDTO getRecord(Long recordId) {
        Record record = recordRepository.findByIdWithUpload(recordId);
        if (record == null) {
            throw new RecordNotFoundException(recordId);
        }
        
        return convertToResponseDTOWithUrl(record);
    }
    
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getRecordsByUser(Long userId) {
        List<Record> records = recordRepository.findByUserIdWithUpload(userId);
        return convertToResponseDTOsWithUrl(records);
    }
    
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getRecordsBySong(Long songId) {
        List<Record> records = recordRepository.findBySongId(songId);
        return convertToResponseDTOsWithUrl(records);
    }
    
    /**
     * Record 엔티티를 URL이 포함된 RecordResponseDTO로 변환
     */
    private RecordResponseDTO convertToResponseDTOWithUrl(Record record) {
        Upload upload = fileUploadService.getUpload(record.getUploadId());
        RecordResponseDTO responseDTO = recordMapper.toResponseDTO(record, upload);
        
        String fileUrl;
        String urlStatus;
        
        try {
            fileUrl = fileUploadService.getFileUrl(upload);
            urlStatus = "SUCCESS";
            log.debug("파일 URL 생성 성공: uploadId={}", upload.getId());
        } catch (S3UrlGenerationException e) {
            log.warn("S3 Pre-signed URL 생성 실패: uploadId={}, s3Key={}", upload.getId(), e.getS3Key(), e);
            fileUrl = null;
            urlStatus = "FAILED";
        } catch (Exception e) {
            log.warn("파일 URL 생성 중 예상치 못한 오류: uploadId={}", upload.getId(), e);
            fileUrl = null;
            urlStatus = "ERROR";
        }
        
        return responseDTO.toBuilder()
                .url(fileUrl)
                .urlStatus(urlStatus)
                .build();
    }
    
    /**
     * Record 엔티티 리스트를 URL이 포함된 RecordResponseDTO 리스트로 변환
     */
    private List<RecordResponseDTO> convertToResponseDTOsWithUrl(List<Record> records) {
        return records.stream()
                .map(this::convertToResponseDTOWithUrl)
                .collect(Collectors.toList());
    }
    
    /**
     * 오디오 파일 처리 및 업로드 공통 로직 (책임 분리)
     */
    private Upload processAndUploadAudioFile(MultipartFile audioFile, Long userId) {
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
                log.info("오디오 파일 WAV 변환 완료: {}", audioFile.getOriginalFilename());
            }
            
            // 4. S3에 업로드 (UUID는 이미 파일명에서 추출됨)
            Upload upload = fileUploadService.uploadLocalFile(fileToUpload, "recordings", userId, audioFile.getOriginalFilename());
            
            // 5. 올바른 UUID로 업데이트 (파일명에서 추출된 UUID가 우리가 생성한 UUID와 일치하는지 확인)
            if (!upload.getUuid().equals(uuid)) {
                upload = upload.toBuilder().uuid(uuid).build();
                upload = uploadRepository.save(upload);
            }
            
            // 6. 원본 임시 파일 정리 (S3 업로드 후에만 정리)
            cleanupTemporaryFile(originalFilePath);
            
            return upload;
            
        } catch (Exception e) {
            log.error("오디오 파일 처리 실패: {}", audioFile.getOriginalFilename(), e);
            throw new RecordOperationException("오디오 파일 처리에 실패했습니다: " + e.getMessage(), e);
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
            
            // 1. Record 삭제 (외래키 제약조건 때문에 먼저 삭제)
            recordRepository.delete(record);
            
            // 2. 파일 삭제 (S3 + DB)
            fileUploadService.deleteFile(record.getUploadId());
            
            log.info("녹음 파일 삭제 성공: recordId={}, userId={}", recordId, userId);
            
        } catch (RecordNotFoundException | RecordPermissionDeniedException e) {
            // 커스텀 예외는 그대로 전파하여 GlobalExceptionHandler가 처리하도록 함
            throw e;
        } catch (Exception e) {
            log.error("녹음 파일 삭제 실패: recordId={}, userId={}", recordId, userId, e);
            throw new RecordOperationException("녹음 파일 삭제에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    public RecordResponseDTO updateRecord(Long recordId, String title, MultipartFile audioFile, Long userId) {
        try {
            Record record = recordRepository.findById(recordId)
                    .orElseThrow(() -> new RecordNotFoundException(recordId));
            
            // 권한 확인
            if (!record.getUserId().equals(userId)) {
                throw new RecordPermissionDeniedException(recordId, userId);
            }
            
            // 변경사항 확인
            boolean titleChanged = !record.getTitle().equals(title);
            boolean audioFileProvided = audioFile != null && !audioFile.isEmpty();
            
            // 아무 변경사항이 없으면 기존 데이터 반환
            if (!titleChanged && !audioFileProvided) {
                log.info("녹음 파일 수정 요청이지만 변경사항 없음: recordId={}, userId={}", recordId, userId);
                return convertToResponseDTOWithUrl(record);
            }
            
            Record.RecordBuilder recordBuilder = record.toBuilder();
            
            // 제목이 변경된 경우에만 업데이트
            if (titleChanged) {
                recordBuilder.title(title);
            }
            
            // 새로운 오디오 파일이 제공된 경우 파일 교체
            if (audioFileProvided) {
                // 1. 기존 파일 삭제
                fileUploadService.deleteFile(record.getUploadId());
                
                // 2. 새 파일 처리 및 업로드 (공통 로직 사용)
                Upload newUpload = processAndUploadAudioFile(audioFile, userId);
                Integer calculatedDuration = audioDurationCalculator.calculateDurationInSeconds(
                    uploadPath + "/" + newUpload.getStoredFilename()
                );
                
                // 3. Record의 uploadId와 duration 업데이트
                recordBuilder.uploadId(newUpload.getId()).durationSeconds(calculatedDuration);
            }
            
            Record updatedRecord = recordBuilder.build();
            Record savedRecord = recordRepository.save(updatedRecord);
            
            log.info("녹음 파일 수정 성공: recordId={}, userId={}, titleChanged={}, fileUpdated={}", 
                    recordId, userId, titleChanged, audioFileProvided);
            
            return convertToResponseDTOWithUrl(savedRecord);
            
        } catch (RecordNotFoundException | RecordPermissionDeniedException e) {
            // 커스텀 예외는 그대로 전파하여 GlobalExceptionHandler가 처리하도록 함
            throw e;
        } catch (Exception e) {
            log.error("녹음 파일 수정 실패: recordId={}, userId={}", recordId, userId, e);
            throw new RecordOperationException("녹음 파일 수정에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    /**
     * 임시 파일 안전한 정리 (중복 삭제 방지)
     */
    private void cleanupTemporaryFile(String filePath) {
        if (filePath == null) return;
        
        try {
            boolean deleted = Files.deleteIfExists(Paths.get(filePath));
            if (deleted) {
                log.info("임시 파일 삭제 완료: {}", filePath);
            } else {
                log.debug("임시 파일이 이미 존재하지 않음: {}", filePath);
            }
        } catch (Exception e) {
            log.warn("임시 파일 삭제 실패: {} - {}", filePath, e.getMessage());
        }
    }
}