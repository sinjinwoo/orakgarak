package com.ssafy.lab.orak.s3.helper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

import java.nio.file.Path;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Log4j2
public class S3Helper {
    private final S3Client s3Client;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${spring.cloud.aws.region.static}")
    private String region;

    //기타 헬퍼 메서드들 ===================================================================================
    //전체 파일명 생성 (UUID_원본파일명)
    public String createFullFileName(String uuid , String fileName){ return uuid + "_" + fileName;}
    //썸네일 파일명 생성 ( s_UUID_원본파일명)
    public String createThumbnailFileName(String uuid, String fileName){ return "s_" + uuid + "_" + fileName;}
    //파일 이미지 인지 확인
    public boolean isImageFile(String fileName) {
        if (fileName == null || !fileName.contains(".")) return false;
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        return Arrays.asList("jpg", "jpeg", "png", "gif", "bmp", "webp").contains(extension);
    }
    // URL 파싱 메서드들 ===========================================
    //url에서 uuid 추출
    public String extractUuidFromUrl(String url) {
        try {
            // URL에서 파일명 부분 추출
            String fileName = url.substring(url.lastIndexOf("/") + 1);
            // 첫 번째 '_' 앞까지가 UUID
            int underscoreIndex = fileName.indexOf('_');
            if (underscoreIndex > 0) {
                return fileName.substring(0, underscoreIndex);
            }
        } catch (Exception e) {
            log.error("URL에서 UUID 추출 실패: {} - {}", url, e.getMessage());
        }
        return null;
    }
    //URL에서 원본 파일명 추출
    public String extractFileNameFromUrl(String url) {
        try {
            // URL에서 파일명 부분 추출
            String fileName = url.substring(url.lastIndexOf("/") + 1);
            // 첫 번째 '_' 뒤부터가 원본 파일명
            int underscoreIndex = fileName.indexOf('_');
            if (underscoreIndex > 0 && underscoreIndex < fileName.length() - 1) {
                return fileName.substring(underscoreIndex + 1);
            }
        } catch (Exception e) {
            log.error("URL에서 파일명 추출 실패: {} - {}", url, e.getMessage());
        }
        return null;
    }
    //url에서 전체 파일명 추출
    public String extractFullFileNameFromUrl(String url) {
        try {
            return url.substring(url.lastIndexOf("/") + 1);
        } catch (Exception e) {
            log.error("URL에서 전체 파일명 추출 실패: {} - {}", url, e.getMessage());
        }
        return null;
    }
    // url 생성 메서드들 ======================================================================================
    //기타 원본 파일 URL 생성
    public String getOriginalUrl(String uuid , String fileName){
        return String.format("https://%s.s3.%s.amazonaws.com/%s" , bucket , region , createFullFileName(uuid,fileName));
    }
    //썸네일 url 생성(이미지인 경우만)
    public String getThumbnailUrl(String uuid , String fileName){
        return String.format("https://%s.s3.%s.amazonaws.com/%s" , bucket , region , createThumbnailFileName(uuid,fileName));
    }
    //도메인별 원본 파일 생성
    public String getDomainOriginalUrl(String domain, String uuid, String fileName){
        return String.format("https://%s.s3.%s.amazonaws.com/%s/%s" , domain , region , bucket , createFullFileName(uuid,fileName));
    }
    //도메인 별 썸네일 url 생성
    public String getDomainThumbnailUrl(String domain, String uuid, String fileName){
        return String.format("https://%s.s3.%s.amazonaws.com/%s/%s" , domain , region , bucket , createThumbnailFileName(uuid,fileName));
    }

    // S3 키로 URL 생성 (간단한 버전)
    public String getS3Url(String s3Key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, s3Key);
    }

    // S3 업로드 헬퍼 메서드
    public void uploadToS3(String s3Key, Path filePath) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();
        s3Client.putObject(putObjectRequest, filePath);
    }

    // S3 삭제 헬퍼 메서드
    public void deleteFromS3(String s3Key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
    }

    // Presigned URL 생성 헬퍼 메서드
    public String createPresignedUrl(String s3Key, Duration duration, S3Presigner s3Presigner) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(duration)
                .putObjectRequest(objectRequest)
                .build();
        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        return presignedRequest.url().toString();
    }


}