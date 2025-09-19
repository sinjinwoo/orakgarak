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
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;

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

    /**
     * S3에서 파일 다운로드
     */
    public String downloadFile(String s3Key, String localFilePath) throws IOException {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            File localFile = new File(localFilePath);
            if (localFile.getParentFile() != null) {
                localFile.getParentFile().mkdirs(); // 디렉토리 생성
            }

            // AWS SDK v2에서는 Path를 직접 사용
            s3Client.getObject(getObjectRequest, localFile.toPath());

            log.info("S3에서 파일 다운로드 완료: {} -> {}", s3Key, localFilePath);
            return localFilePath;
        } catch (Exception e) {
            log.error("S3 파일 다운로드 실패: {} -> {}", s3Key, localFilePath, e);
            throw new IOException("S3 파일 다운로드에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * S3에 파일 업로드
     */
    public void uploadFile(File file, String s3Key, String contentType) throws IOException {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromFile(file));
            log.info("S3에 파일 업로드 완료: {} -> {}", file.getPath(), s3Key);
        } catch (Exception e) {
            log.error("S3 파일 업로드 실패: {} -> {}", file.getPath(), s3Key, e);
            throw new IOException("S3 파일 업로드에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * S3에서 파일 삭제
     */
    public void deleteFile(String s3Key) throws IOException {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("S3 파일 삭제 완료: {}", s3Key);
        } catch (Exception e) {
            log.error("S3 파일 삭제 실패: {}", s3Key, e);
            throw new IOException("S3 파일 삭제에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * S3 파일 복사 (같은 버킷 내)
     */
    public void copyFile(String sourceS3Key, String destinationS3Key) throws IOException {
        try {
            CopyObjectRequest copyObjectRequest = CopyObjectRequest.builder()
                    .sourceBucket(bucket)
                    .sourceKey(sourceS3Key)
                    .destinationBucket(bucket)
                    .destinationKey(destinationS3Key)
                    .build();

            s3Client.copyObject(copyObjectRequest);
            log.info("S3 파일 복사 완료: {} -> {}", sourceS3Key, destinationS3Key);
        } catch (Exception e) {
            log.error("S3 파일 복사 실패: {} -> {}", sourceS3Key, destinationS3Key, e);
            throw new IOException("S3 파일 복사에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * S3 파일 존재 여부 확인
     */
    public boolean fileExists(String s3Key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            log.debug("S3 파일이 존재하지 않음: {}", s3Key);
            return false;
        } catch (Exception e) {
            log.warn("S3 파일 존재 여부 확인 실패: {} - {}", s3Key, e.getMessage());
            return false;
        }
    }
}