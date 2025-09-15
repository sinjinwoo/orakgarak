package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Log4j2
public class ProfileImageService {

    private final FileUploadService fileUploadService;
    private final S3Helper s3Helper;
    private final S3Uploader s3Uploader;
    private final LocalUploader localUploader;
    
    @Value("${app.profile.image.base-url}")
    private String baseUrl;
    
    private static final String PROFILE_DIRECTORY = "profiles";
    private static final String DEFAULT_IMAGE_PREFIX = "/api/images/";
    private static final List<String> DEFAULT_IMAGES = Arrays.asList(
            "deafault1.png", "deafault2.png", "deafault3.png"
    );
    
    private final Random random = new Random();

    public String uploadProfileImage(MultipartFile imageFile, Long userId) {
        try {
            // 1. 로컬에 임시 저장
            String localFilePath = localUploader.uploadLocal(imageFile);
            
            // 2. S3에 업로드 (uploadLocalFile 사용)
            Upload upload = fileUploadService.uploadLocalFile(localFilePath, PROFILE_DIRECTORY, userId, imageFile.getOriginalFilename());
            String s3Key = upload.getFullPath();
            
            // 3. 로컬 임시 파일 삭제
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(localFilePath));
                log.info("로컬 임시 파일 삭제 완료: {}", localFilePath);
            } catch (Exception e) {
                log.warn("로컬 임시 파일 삭제 실패: {}", localFilePath, e);
            }
            
            log.info("프로필 이미지 업로드 완료 - userId: {}, s3Key: {}", userId, s3Key);
            return s3Key;
        } catch (Exception e) {
            log.error("프로필 이미지 업로드 실패 - userId: {}", userId, e);
            throw new RuntimeException("프로필 이미지 업로드 실패: " + e.getMessage(), e);
        }
    }

    public String getProfileImageUrl(String s3KeyOrPath) {
        if (s3KeyOrPath == null || s3KeyOrPath.isBlank()) {
            return null;
        }
        
        // 기본 이미지인지 확인 (static resource 경로로 시작하는지)
        if (s3KeyOrPath.startsWith(DEFAULT_IMAGE_PREFIX)) {
            return baseUrl + s3KeyOrPath;
        }
        
        // S3 이미지인 경우 presigned URL 생성
        return s3Helper.generatePresignedUrl(s3KeyOrPath, Duration.ofHours(24));
    }

    public void deleteProfileImage(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return;
        }
        
        // 기본 이미지는 삭제하지 않음
        if (s3Key.startsWith(DEFAULT_IMAGE_PREFIX)) {
            log.info("기본 이미지는 삭제하지 않음 - path: {}", s3Key);
            return;
        }
        
        try {
            s3Uploader.removeS3File(s3Key);
            log.info("프로필 이미지 삭제 완료 - s3Key: {}", s3Key);
        } catch (Exception e) {
            log.error("프로필 이미지 삭제 실패 - s3Key: {}", s3Key, e);
        }
    }
    
    public String getRandomDefaultImagePath() {
        String randomImage = DEFAULT_IMAGES.get(random.nextInt(DEFAULT_IMAGES.size()));
        return DEFAULT_IMAGE_PREFIX + randomImage;
    }
}