package com.ssafy.lab.orak.s3.helper;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Log4j2
public class S3Helper {

    private final S3Client s3Client;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${spring.cloud.aws.region.static}")
    private String region;

    // URL 생성 메서드
    public String getS3Url(String s3Key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, s3Key);
    }

    // URL에서 파일명 추출
    public String extractFullFileNameFromUrl(String url) {
        try {
            return url.substring(url.lastIndexOf("/") + 1);
        } catch (Exception e) {
            log.error("URL에서 전체 파일명 추출 실패: {} - {}", url, e.getMessage());
        }
        return null;
    }

    // Pre-signed URL 생성 (스트리밍/재생용)
    public String generatePresignedUrl(String s3Key, Duration expiration) {
        try (S3Presigner presigner = S3Presigner.builder()
                .region(software.amazon.awssdk.regions.Region.of(region))
                .build()) {
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            return presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Pre-signed URL 생성 실패: {} - {}", s3Key, e.getMessage(), e);
            return null;
        }
    }

    // 기본 24시간 유효한 Pre-signed URL 생성 (플레이리스트 고려)
    public String generatePresignedUrl(String s3Key) {
        return generatePresignedUrl(s3Key, Duration.ofHours(24));
    }
}