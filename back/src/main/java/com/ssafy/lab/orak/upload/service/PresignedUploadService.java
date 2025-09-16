package com.ssafy.lab.orak.upload.service;

import com.ssafy.lab.orak.s3.exception.PresignedUrlException;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.dto.PresignedUploadRequest;
import com.ssafy.lab.orak.upload.dto.PresignedUploadResponse;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.exception.InvalidFileException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresignedUploadService {

    private final S3Helper s3Helper;
    private final UploadRepository uploadRepository;

    public PresignedUploadResponse generatePresignedUploadUrl(PresignedUploadRequest request, Long userId) {
        try {
            // 파일 유효성 검증
            validateUploadRequest(request);
            
            // 파일명에서 확장자 추출
            String originalFilename = request.getOriginalFilename();
            String extension = "";
            String filenameWithoutExtension = originalFilename;
            
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                filenameWithoutExtension = originalFilename.substring(0, originalFilename.lastIndexOf("."));
            }
            
            // UUID 생성
            String uuid = UUID.randomUUID().toString();
            
            // S3 키 생성 (uploads/{uuid}/originalFilename)
            String s3Key = String.format("%s/%s/%s", 
                    request.getDirectory(), 
                    uuid, 
                    originalFilename);
            
            // Presigned URL 생성 (PUT 요청용, 1시간 유효)
            String presignedUrl = s3Helper.generatePresignedPutUrl(s3Key, Duration.ofHours(1));
            
            // DB에 메타데이터 먼저 저장 (상태: PENDING)
            Upload upload = Upload.builder()
                    .originalFilename(filenameWithoutExtension)
                    .uuid(uuid)
                    .extension(extension)
                    .uploaderId(userId)
                    .fileSize(request.getFileSize())
                    .contentType(request.getContentType())
                    .directory(request.getDirectory())
                    .processingStatus(ProcessingStatus.PENDING)
                    .build();
            
            Upload savedUpload = uploadRepository.save(upload);
            
            log.info("Presigned URL 생성 완료: upload: {} (uuid: {})", 
                    savedUpload.getId(), uuid);
            
            return PresignedUploadResponse.builder()
                    .uploadId(savedUpload.getId())
                    .uuid(uuid)
                    .presignedUrl(presignedUrl)
                    .s3Key(s3Key)
                    .originalFilename(originalFilename)
                    .uploadMetadata("Upload metadata created, awaiting S3 upload completion")
                    .build();
            
        } catch (Exception e) {
            log.error("Presigned URL 생성에 실패했습니다", e);
            throw new PresignedUrlException("Presigned URL 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private void validateUploadRequest(PresignedUploadRequest request) {
        if (request.getOriginalFilename() == null || request.getOriginalFilename().trim().isEmpty()) {
            throw new InvalidFileException("파일명이 비어있습니다");
        }
        
        if (request.getContentType() == null || request.getContentType().trim().isEmpty()) {
            throw new InvalidFileException("Content-Type이 비어있습니다");
        }
        
        if (request.getFileSize() == null || request.getFileSize() <= 0) {
            throw new InvalidFileException("파일 크기가 유효하지 않습니다");
        }
        
        if (request.getDirectory() == null || request.getDirectory().trim().isEmpty()) {
            throw new InvalidFileException("디렉토리가 비어있습니다");
        }
        
        // 파일 크기 제한 (100MB)
        if (request.getFileSize() > 100L * 1024 * 1024) {
            throw new InvalidFileException("파일 크기가 100MB를 초과합니다");
        }
        
        // 지원하는 파일 형식 검증 (필요시)
        validateFileType(request.getOriginalFilename(), request.getContentType());
    }
    
    private void validateFileType(String filename, String contentType) {
        // 오디오 파일 형식 확인
        if (contentType.startsWith("audio/")) {
            return; // 오디오 파일은 허용
        }
        
        // 이미지 파일 형식 확인
        if (contentType.startsWith("image/")) {
            return; // 이미지 파일도 허용
        }
        
        // 확장자 기반 검증
        if (filename != null) {
            String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
            if (isAllowedExtension(extension)) {
                return;
            }
        }
        
        throw new InvalidFileException("지원하지 않는 파일 형식입니다: " + contentType);
    }
    
    private boolean isAllowedExtension(String extension) {
        String[] allowedExtensions = {
            "mp3", "wav", "m4a", "flac", "aac", "ogg", // 오디오
            "jpg", "jpeg", "png", "gif", "webp", // 이미지
            "txt", "pdf", "doc", "docx" // 문서 (필요시)
        };
        
        for (String allowed : allowedExtensions) {
            if (allowed.equals(extension)) {
                return true;
            }
        }
        return false;
    }
}