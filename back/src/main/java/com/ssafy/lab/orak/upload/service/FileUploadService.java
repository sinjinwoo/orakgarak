package com.ssafy.lab.orak.upload.service;

import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.exception.UploadNotFoundException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
                throw new IllegalArgumentException("빈 파일입니다");
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
            
            // S3 업로드
            String localFilePath = localUploader.uploadLocal(file);
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
    
    public String generatePresignedUrl(String directory, String fileName, int durationHours) {
        String uuid = UUID.randomUUID().toString();
        Duration duration = Duration.ofHours(durationHours);
        return s3Uploader.generatePresignedUrl(directory, uuid, fileName, duration);
    }
    
    public List<String> generatePresignedUrls(String directory, List<String> fileNames, int durationHours) {
        Duration duration = Duration.ofHours(durationHours);
        return s3Uploader.generatePresignedUrls(directory, fileNames, duration);
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
    
    public void deleteFiles(List<Long> uploadIds) {
        for (Long uploadId : uploadIds) {
            deleteFile(uploadId);
        }
        log.info("다중 파일 삭제 성공: {}", uploadIds.size());
    }
    
    public Upload uploadLocalFile(String localFilePath, String directory, Long userId, String originalFilename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(localFilePath);
            java.io.File file = filePath.toFile();
            
            if (!file.exists()) {
                throw new IllegalArgumentException("로컬 파일이 존재하지 않습니다: " + localFilePath);
            }
            
            // 확장자 추출 및 파일명에서 확장자 제거
            String extension = "";
            String filenameWithoutExtension = originalFilename;
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                // 확장자를 제거한 파일명만 저장
                filenameWithoutExtension = originalFilename.substring(0, originalFilename.lastIndexOf("."));
            }
            
            // UUID 생성
            String uuid = UUID.randomUUID().toString();
            
            // UUID를 사용한 새 파일명으로 임시 파일 생성
            String uuidFilename = uuid + "_" + originalFilename;
            java.nio.file.Path tempPath = filePath.getParent().resolve(uuidFilename);
            java.nio.file.Files.copy(filePath, tempPath);
            
            // S3 업로드 (UUID 파일명 사용)
            String s3Url = s3Uploader.upload(tempPath.toString(), directory);
            
            // 임시 파일 삭제
            try {
                java.nio.file.Files.deleteIfExists(tempPath);
            } catch (Exception e) {
                log.warn("임시 파일 삭제 실패: {}", tempPath, e);
            }
            
            // 파일 타입 추출
            String contentType;
            try {
                contentType = java.nio.file.Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
            } catch (Exception e) {
                contentType = "application/octet-stream";
            }
            
            // Upload 엔티티 생성 및 저장
            Upload upload = Upload.builder()
                    .originalFilename(filenameWithoutExtension)
                    .uuid(uuid)
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
    
    
    // URL 동적 생성 메서드
    public String getFileUrl(Upload upload) {
        String s3Key = upload.getFullPath();
        return s3Helper.getS3Url(s3Key);
    }
    
    public String getFileUrl(Long uploadId) {
        Upload upload = getUpload(uploadId);
        return getFileUrl(upload);
    }
}