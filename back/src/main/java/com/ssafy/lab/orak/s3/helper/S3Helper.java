package com.ssafy.lab.orak.s3.helper;

import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Log4j2
public class S3Helper {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

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
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Pre-signed URL 생성 실패: {} - {}", s3Key, e.getMessage(), e);
            throw new S3UrlGenerationException(s3Key, "Pre-signed URL 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    // 기본 24시간 유효한 Pre-signed URL 생성 (플레이리스트 고려)
    public String generatePresignedUrl(String s3Key) {
        return generatePresignedUrl(s3Key, Duration.ofHours(24));
    }

    /**
     * S3 키에서 UUID 추출
     * 패턴: {directory}/{uuid}_{filename} → {uuid}
     * 예: recordings/abc123_audio.mp3 → abc123
     *     profiles/def456_image.jpg → def456
     *     album-covers/xyz789_cover.jpg → xyz789
     */
    public String extractUuidFromS3Key(String s3Key) {
        if (s3Key == null || !s3Key.contains("/")) {
            return null;
        }

        try {
            String[] parts = s3Key.split("/");
            if (parts.length >= 2) {
                String filenamePart = parts[1]; // uuid_filename 부분

                // uuid_filename 패턴에서 UUID 추출
                int underscoreIndex = filenamePart.indexOf("_");
                if (underscoreIndex > 0) {
                    return filenamePart.substring(0, underscoreIndex); // UUID 부분만 반환
                }
            }
        } catch (Exception e) {
            log.error("S3 키에서 UUID 추출 실패: {} - {}", s3Key, e.getMessage());
        }

        return null;
    }
    
    // Pre-signed PUT URL 생성 (업로드용)
    public String generatePresignedPutUrl(String s3Key, Duration expiration) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .putObjectRequest(putObjectRequest)
                    .build();

            return s3Presigner.presignPutObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Pre-signed PUT URL 생성 실패: {} - {}", s3Key, e.getMessage(), e);
            throw new S3UrlGenerationException(s3Key, "Pre-signed PUT URL 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }
}