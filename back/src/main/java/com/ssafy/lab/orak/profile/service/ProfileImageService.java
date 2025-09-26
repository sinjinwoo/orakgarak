package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.profile.exception.ProfileImageDeleteException;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
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
    private final UploadRepository uploadRepository;
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

    public Upload uploadProfileImage(MultipartFile imageFile, Long userId) {
        try {
            // 1. 로컬에 임시 저장
            String localFilePath = localUploader.uploadLocal(imageFile);

            // 2. S3에 업로드 (uploadLocalFile 사용)
            Upload upload = fileUploadService.uploadLocalFile(localFilePath, PROFILE_DIRECTORY, userId, imageFile.getOriginalFilename());

            // 3. 로컬 임시 파일 삭제
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(localFilePath));
                log.info("로컬 임시 파일 삭제 완료: {}", localFilePath);
            } catch (Exception e) {
                log.warn("로컬 임시 파일 삭제 실패: {}", localFilePath, e);
            }

            log.info("프로필 이미지 업로드 완료 - userId: {}, uploadId: {}", userId, upload.getId());
            return upload;
        } catch (Exception e) {
            log.error("프로필 이미지 업로드 실패 - userId: {}", userId, e);
            throw new RuntimeException("프로필 이미지 업로드 실패: " + e.getMessage(), e);
        }
    }

    public String getProfileImageUrl(Upload upload) {
        if (upload == null) {
            // Upload가 null이면 기본 이미지 반환
            return getRandomDefaultImageUrl();
        }

        // S3 업로드 이미지인 경우 presigned URL 생성
        String s3Key = upload.getFullPath();
        return s3Helper.generatePresignedUrl(s3Key, Duration.ofHours(24));
    }


    public void deleteProfileImage(Upload upload) {
        deleteProfileImage(upload, false);
    }

    public void deleteProfileImage(Upload upload, boolean throwOnFailure) {
        if (upload == null) {
            return;
        }

        String s3Key = upload.getFullPath();

        // 기본 이미지는 삭제하지 않음
        if (s3Key.startsWith(DEFAULT_IMAGE_PREFIX)) {
            log.info("기본 이미지는 삭제하지 않음 - uploadId: {}, path: {}", upload.getId(), s3Key);
            return;
        }

        try {
            // 1. S3에서 파일 삭제
            s3Uploader.removeS3File(s3Key);

            // 2. Upload 엔티티 삭제
            uploadRepository.delete(upload);

            log.info("프로필 이미지 삭제 완료 - uploadId: {}, s3Key: {}", upload.getId(), s3Key);
        } catch (Exception e) {
            log.error("프로필 이미지 삭제 실패 - uploadId: {}, s3Key: {}", upload.getId(), s3Key, e);
            if (throwOnFailure) {
                throw new ProfileImageDeleteException("프로필 이미지 삭제 실패: " + s3Key, e);
            }
        }
    }

    private void deleteS3Image(String s3Key, boolean throwOnFailure) {
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
            if (throwOnFailure) {
                throw new ProfileImageDeleteException("프로필 이미지 삭제 실패: " + s3Key, e);
            }
        }
    }
    
    public String getRandomDefaultImagePath() {
        String randomImage = DEFAULT_IMAGES.get(random.nextInt(DEFAULT_IMAGES.size()));
        return DEFAULT_IMAGE_PREFIX + randomImage;
    }

    public String getRandomDefaultImageUrl() {
        String randomImagePath = getRandomDefaultImagePath();
        return baseUrl + randomImagePath;
    }
}