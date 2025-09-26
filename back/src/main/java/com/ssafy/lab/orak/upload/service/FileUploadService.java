package com.ssafy.lab.orak.upload.service;

import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.exception.InvalidFileException;
import com.ssafy.lab.orak.upload.exception.UploadNotFoundException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class FileUploadService {
    
    private final S3Helper s3Helper;
    private final LocalUploader localUploader;
    private final S3Uploader s3Uploader;
    private final UploadRepository uploadRepository;
    
    public List<Upload> uploadFiles(List<MultipartFile> files, String directory, Long userId) {
        List<Upload> uploadedFiles = new ArrayList<>();
        
        for (MultipartFile file : files) {
            try {
                Upload upload = uploadSingleFile(file, directory, userId);
                uploadedFiles.add(upload);
            } catch (Exception e) {
                log.error("파일 업로드 실패: {}", file.getOriginalFilename(), e);
                throw new FileUploadException("파일 업로드 실패: " + e.getMessage(), e);
            }
        }
        
        return uploadedFiles;
    }
    
    public Upload uploadSingleFile(MultipartFile file, String directory, Long userId) {
        try {
            if (file.isEmpty()) {
                throw new InvalidFileException("빈 파일입니다");
            }
            
            // 파일명에서 확장자 추출
            String fullFilename = file.getOriginalFilename();
            String originalFilename = fullFilename;
            String extension = "";
            if (fullFilename != null && fullFilename.contains(".")) {
                extension = fullFilename.substring(fullFilename.lastIndexOf(".") + 1);
                // 확장자를 제거한 파일명만 저장
                originalFilename = fullFilename.substring(0, fullFilename.lastIndexOf("."));
            }
            
            // UUID 생성
            String uuid = UUID.randomUUID().toString();
            
            // S3 업로드 (UUID와 함께)
            String localFilePath = localUploader.uploadLocal(file, uuid);
            String s3Url = s3Uploader.upload(localFilePath, directory);
            
            // Upload 엔티티 생성 및 저장
            Upload upload = Upload.builder()
                    .originalFilename(originalFilename)
                    .uuid(uuid)
                    .extension(extension)
                    .uploaderId(userId)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .directory(directory)
                    .build();
            
            Upload savedUpload = uploadRepository.save(upload);
            
            log.info("파일 업로드 및 DB 저장 성공: {}", file.getOriginalFilename());
            return savedUpload;
            
        } catch (Exception e) {
            log.error("단일 파일 업로드 실패: {}", file.getOriginalFilename(), e);
            throw new FileUploadException("파일 업로드 실패: " + e.getMessage(), e);
        }
    }
    public void deleteFile(Long uploadId) {
        Upload upload = uploadRepository.findById(uploadId)
                .orElseThrow(() -> new UploadNotFoundException(uploadId));
        
        try {
            // S3에서 파일 삭제
            s3Uploader.removeS3File(upload.getFullPath());
            
            // DB에서 업로드 기록 삭제
            uploadRepository.delete(upload);
            
            log.info("파일 삭제 성공: {}", upload.getOriginalFilename());
        } catch (Exception e) {
            log.error("파일 삭제 실패: uploadId = {}", uploadId, e);
            throw new FileUploadException("파일 삭제 실패: " + e.getMessage(), e);
        }
    }
    // 최적화된 로컬 파일 업로드 (UUID 중복 방지 - RecordService용)
    public Upload uploadLocalFile(String localFilePath, String directory, Long userId, String originalFilename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(localFilePath);
            java.io.File file = filePath.toFile();
            
            if (!file.exists()) {
                throw new InvalidFileException("로컬 파일이 존재하지 않습니다: " + localFilePath);
            }
            
            // 확장자 추출 및 파일명에서 확장자 제거
            String extension = "";
            String filenameWithoutExtension = originalFilename;
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                // 확장자를 제거한 파일명만 저장
                filenameWithoutExtension = originalFilename.substring(0, originalFilename.lastIndexOf("."));
            }
            
            // 로컬 파일은 이미 UUID 파일명이므로 추가 파일 조작 불필요
            // 바로 S3에 업로드
            String s3Url = s3Uploader.upload(localFilePath, directory);
            
            // 파일 타입 추출
            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
            } catch (Exception e) {
                contentType = "application/octet-stream";
            }
            
            // UUID를 파일명에서 추출 (이미 UUID_원본파일명 형태)
            String fileName = file.getName();
            String extractedUuid = fileName.contains("_") ? 
                fileName.substring(0, fileName.indexOf("_")) : UUID.randomUUID().toString();
            
            // Upload 엔티티 생성 및 저장
            Upload upload = Upload.builder()
                    .originalFilename(filenameWithoutExtension)
                    .uuid(extractedUuid)
                    .extension(extension)
                    .uploaderId(userId)
                    .fileSize(file.length())
                    .contentType(contentType)
                    .directory(directory)
                    .build();
            
            Upload savedUpload = uploadRepository.save(upload);
            
            log.info("로컬 파일 S3 업로드 및 DB 저장 성공: {}", file.getName());
            return savedUpload;
            
        } catch (Exception e) {
            log.error("로컬 파일 업로드 실패: {}", localFilePath, e);
            throw new FileUploadException("로컬 파일 업로드 실패: " + e.getMessage(), e);
        }
    }

    public Upload getUpload(Long uploadId) {
        return uploadRepository.findById(uploadId)
                .orElseThrow(() -> new UploadNotFoundException(uploadId));
    }
    
    public Upload findByUuid(String uuid) {
        return uploadRepository.findByUuid(uuid).orElse(null);
    }
    
    
    // URL 동적 생성 메서드 (Pre-signed URL 사용)
    public String getFileUrl(Upload upload) {
        String s3Key = upload.getFullPath();
        return s3Helper.generatePresignedUrl(s3Key);
    }
    
    public String getFileUrl(Long uploadId) {
        Upload upload = getUpload(uploadId);
        return getFileUrl(upload);
    }
    
//    처리 상태 관리 메서드들
    
    // 처리 상태 업데이트
    public void updateProcessingStatus(Long uploadId, ProcessingStatus status) {
        Upload upload = getUpload(uploadId);
        upload.updateProcessingStatus(status);
        uploadRepository.save(upload);
        log.info("Processing status updated: uploadId={}, status={}", uploadId, status);
    }
    
    // 처리 실패 시 상태 업데이트
    public void markProcessingFailed(Long uploadId, String errorMessage) {
        Upload upload = getUpload(uploadId);
        upload.markProcessingFailed(errorMessage);
        uploadRepository.save(upload);
        log.error("Processing failed: uploadId={}, error={}", uploadId, errorMessage);
    }
    
    // 오디오 파일 처리가 필요한 업로드 목록 조회 (배치 처리용)
    public List<Upload> getPendingAudioProcessing(int limit) {
        return uploadRepository.findPendingAudioProcessing(limit);
    }

    /**
     * 재시도 로직을 포함한 대기 중인 오디오 처리 조회
     */
    public List<Upload> getPendingAudioProcessingWithRetry(int limit, int maxRetries, long retryDelayMs) {
        // 재시도 가능 시간 계산 (현재 시간에서 지연 시간만큼 빼기)
        java.time.LocalDateTime retryAfterTime = java.time.LocalDateTime.now()
                .minusNanos(retryDelayMs * 1_000_000);

        return uploadRepository.findPendingAudioProcessingWithRetry(limit, maxRetries, retryAfterTime);
    }

    /**
     * Upload 엔티티 저장 (재시도 로직용)
     */
    public Upload save(Upload upload) {
        return uploadRepository.save(upload);
    }
    
    // 특정 상태의 업로드 목록 조회
    public List<Upload> getUploadsByStatus(ProcessingStatus status, int limit) {
        return uploadRepository.findByProcessingStatusOrderByCreatedAtAsc(status, 
                org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }
    
    // 사용자별 특정 상태 업로드 조회
    public List<Upload> getUserUploadsByStatus(Long userId, ProcessingStatus status) {
        return uploadRepository.findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(userId, status);
    }
    
    // Repository 접근 메서드 (컨트롤러에서 직접 사용)
    public UploadRepository getUploadRepository() {
        return uploadRepository;
    }
    
    // 파일 타입에 따른 초기 처리 상태 설정 (향후 확장용)
    private ProcessingStatus determineInitialStatus(Upload upload) {
        if (upload.isAudioFile()) {
            return ProcessingStatus.UPLOADED; // 오디오 파일은 추가 처리 필요
        } else if (upload.isImageFile()) {
            return ProcessingStatus.UPLOADED; // 이미지 파일도 최적화 필요할 수 있음
        } else {
            return ProcessingStatus.COMPLETED; // 기타 파일은 업로드만으로 완료
        }
    }

    // ===============================================
    // DLQ 패턴용 추가 메서드들
    // ===============================================

    /**
     * Kafka에서 놓친 파일들 조회 (배치 처리용)
     */
    public List<Upload> findStuckUploads(int limit, long stuckThresholdMs) {
        java.time.LocalDateTime stuckTime = java.time.LocalDateTime.now()
                .minusNanos(stuckThresholdMs * 1_000_000);

        return uploadRepository.findStuckUploads(limit, stuckTime);
    }

    /**
     * Kafka 헬스 체크용 - 오랫동안 처리되지 않은 파일 개수
     */
    public long countStuckUploads(long timestampMs) {
        java.time.LocalDateTime stuckTime = java.time.LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(timestampMs),
            java.time.ZoneId.systemDefault()
        );

        return uploadRepository.countStuckUploads(stuckTime);
    }

    /**
     * ID로 Upload 조회 (DLQ Consumer용)
     */
    public Upload findById(Long uploadId) {
        return uploadRepository.findById(uploadId).orElse(null);
    }
}