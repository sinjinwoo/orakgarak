package com.ssafy.lab.orak.recording.service;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.mapper.RecordMapper;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.recording.util.AudioDurationCalculator;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.util.List;
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
    
    @Value("${s3.upload.path}")
    private String uploadPath;
    
    public RecordResponseDTO createRecord(String title, Long songId, MultipartFile audioFile, Long userId) {
        try {
            // 1. DTO 생성
            RecordRequestDTO requestDTO = RecordRequestDTO.builder()
                    .title(title)
                    .songId(songId)
                    .audioFile(audioFile)
                    .build();
            
            // 2. 로컬 파일 업로드
            List<String> uploadedPaths = localUploader.uploadLocal(audioFile, null, userId);
            String originalFilePath = uploadedPaths.get(0);
            
            // 3. 오디오 파일인지 확인하고 WAV 변환
            String contentType = Files.probeContentType(java.nio.file.Paths.get(originalFilePath));
            String fileToUpload = originalFilePath;
            
            if (audioConverter.isAudioFile(audioFile.getOriginalFilename(), contentType)) {
                String wavFilePath = audioConverter.convertToWav(originalFilePath, uploadPath);
                fileToUpload = wavFilePath;
                log.info("오디오 파일 WAV 변환 완료: {}", audioFile.getOriginalFilename());
            }
            
            // 4. 오디오 파일의 재생시간 계산
            Integer calculatedDuration = audioDurationCalculator.calculateDurationInSeconds(fileToUpload);
            
            // 5. 변환된 파일을 S3에 업로드
            Upload upload = fileUploadService.uploadLocalFile(fileToUpload, "recordings", userId);
            
            // 6. Record 엔티티 생성 및 저장 (MapStruct 사용)
            Record record = recordMapper.toEntity(requestDTO, userId, upload);
            // 계산된 재생시간 설정
            record = record.toBuilder().durationSeconds(calculatedDuration).build();
            Record savedRecord = recordRepository.save(record);
            
            log.info("녹음 파일 생성 성공: userId={}, recordId={}", userId, savedRecord.getId());
            
            // 7. S3 업로드와 DB 저장이 완료된 후 서버에 있는 임시 파일들 삭제
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(originalFilePath));
                if (!originalFilePath.equals(fileToUpload)) {
                    java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(fileToUpload));
                }
                log.info("서버 임시 파일 삭제 완료");
            } catch (Exception e) {
                log.warn("서버 임시 파일 삭제 실패", e);
            }
            
            // 8. 응답 DTO 반환 (MapStruct 사용)
            return recordMapper.toResponseDTO(savedRecord, upload);
            
        } catch (Exception e) {
            log.error("녹음 파일 생성 실패: userId={}", userId, e);
            throw new FileUploadException("녹음 파일 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public RecordResponseDTO getRecord(Long recordId) {
        Record record = recordRepository.findByIdWithUpload(recordId);
        if (record == null) {
            throw new RecordNotFoundException(recordId);
        }
        return recordMapper.toResponseDTO(record);
    }
    
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getRecordsByUser(Long userId) {
        List<Record> records = recordRepository.findByUserIdWithUpload(userId);
        return records.stream()
                .map(recordMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<RecordResponseDTO> getRecordsBySong(Long songId) {
        List<Record> records = recordRepository.findBySongId(songId);
        return records.stream()
                .map(recordMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
    
    public void deleteRecord(Long recordId, Long userId) {
        try {
            Record record = recordRepository.findById(recordId)
                    .orElseThrow(() -> new RecordNotFoundException(recordId));
            
            // 권한 확인
            if (!record.getUserId().equals(userId)) {
                throw new RecordPermissionDeniedException(recordId, userId);
            }
            
            // 1. 파일 삭제 (S3 + DB)
            fileUploadService.deleteFile(record.getUploadId());
            
            // 2. Record 삭제
            recordRepository.delete(record);
            
            log.info("녹음 파일 삭제 성공: recordId={}, userId={}", recordId, userId);
            
        } catch (RecordNotFoundException | RecordPermissionDeniedException e) {
            // 커스텀 예외는 그대로 전파하여 GlobalExceptionHandler가 처리하도록 함
            throw e;
        } catch (Exception e) {
            log.error("녹음 파일 삭제 실패: recordId={}, userId={}", recordId, userId, e);
            throw new RuntimeException("녹음 파일 삭제에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    public RecordResponseDTO updateRecord(Long recordId, String title, Long userId) {
        try {
            Record record = recordRepository.findById(recordId)
                    .orElseThrow(() -> new RecordNotFoundException(recordId));
            
            // 권한 확인
            if (!record.getUserId().equals(userId)) {
                throw new RecordPermissionDeniedException(recordId, userId);
            }
            
            // 제목만 수정 (toBuilder 활용)
            Record updatedRecord = record.toBuilder()
                    .title(title)
                    .build();
            
            Record savedRecord = recordRepository.save(updatedRecord);
            
            log.info("녹음 파일 수정 성공: recordId={}, userId={}", recordId, userId);
            
            return recordMapper.toResponseDTO(savedRecord);
            
        } catch (RecordNotFoundException | RecordPermissionDeniedException e) {
            // 커스텀 예외는 그대로 전파하여 GlobalExceptionHandler가 처리하도록 함
            throw e;
        } catch (Exception e) {
            log.error("녹음 파일 수정 실패: recordId={}, userId={}", recordId, userId, e);
            throw new RuntimeException("녹음 파일 수정에 실패했습니다: " + e.getMessage(), e);
        }
    }
}