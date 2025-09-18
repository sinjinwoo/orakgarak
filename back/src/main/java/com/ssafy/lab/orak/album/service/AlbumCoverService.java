package com.ssafy.lab.orak.album.service;

import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationRequestDto;
import com.ssafy.lab.orak.ai.service.PythonAiService;
import com.ssafy.lab.orak.album.dto.AlbumCoverGenerateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumCoverUploadResponseDto;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class AlbumCoverService {

    private final S3Uploader s3Uploader;
    private final PythonAiService pythonAiService;

    private static final String ALBUM_COVER_DIRECTORY = "album-covers";
    private static final Duration PRESIGNED_URL_DURATION = Duration.ofHours(1);

    public AlbumCoverUploadResponseDto uploadAlbumCover(Long albumId, Long userId, MultipartFile file) {
        validateImageFile(file);

        try {
            // 1. 임시 파일로 저장
            String tempFilePath = saveTemporaryFile(file);

            // 2. S3에 업로드
            String uuid = UUID.randomUUID().toString();
            String originalFileName = file.getOriginalFilename();
            String s3Url = s3Uploader.upload(tempFilePath, ALBUM_COVER_DIRECTORY);

            // 3. Presigned URL 생성
            String presignedUrl = s3Uploader.generatePresignedUrl(
                    ALBUM_COVER_DIRECTORY,
                    uuid,
                    originalFileName,
                    PRESIGNED_URL_DURATION
            );

            // 4. S3 키 생성
            String s3Key = String.format("%s/%s_%s", ALBUM_COVER_DIRECTORY, uuid, originalFileName);

            // TODO: Upload 엔티티에 저장하고 uploadId 반환
            Long uploadId = saveUploadRecord(albumId, userId, s3Key, originalFileName);

            log.info("Album cover uploaded successfully for album: {}, user: {}", albumId, userId);

            return AlbumCoverUploadResponseDto.builder()
                    .uploadId(uploadId)
                    .presignedUrl(presignedUrl)
                    .s3Key(s3Key)
                    .originalFileName(originalFileName)
                    .build();

        } catch (Exception e) {
            log.error("Failed to upload album cover for album: {}, user: {}", albumId, userId, e);
            throw new RuntimeException("앨범 커버 업로드 실패: " + e.getMessage(), e);
        }
    }

    public Mono<AlbumCoverUploadResponseDto> generateAlbumCover(Long albumId, Long userId, AlbumCoverGenerateRequestDto request) {
        log.info("Generating AI album cover for album: {}, user: {}", albumId, userId);

        // DTO 변환
        VoiceImageGenerationRequestDto aiRequest = VoiceImageGenerationRequestDto.builder()
                .records(request.records())
                .aspectRatio(request.aspectRatio())
                .safetyFilterLevel(request.safetyFilterLevel())
                .personGeneration(request.personGeneration())
                .build();

        return pythonAiService.generateVoiceImage(aiRequest)
                .flatMap(aiResponse -> {
                    if (!aiResponse.success()) {
                        return Mono.error(new RuntimeException("AI 이미지 생성 실패: " + aiResponse.error()));
                    }

                    try {
                        // Base64 이미지를 파일로 저장
                        String tempFilePath = saveBase64ImageToFile(aiResponse.imageBase64());

                        // S3에 업로드
                        String uuid = UUID.randomUUID().toString();
                        String fileName = "ai_generated_cover.jpg";
                        String s3Url = s3Uploader.upload(tempFilePath, ALBUM_COVER_DIRECTORY);

                        // Presigned URL 생성
                        String presignedUrl = s3Uploader.generatePresignedUrl(
                                ALBUM_COVER_DIRECTORY,
                                uuid,
                                fileName,
                                PRESIGNED_URL_DURATION
                        );

                        // S3 키 생성
                        String s3Key = String.format("%s/%s_%s", ALBUM_COVER_DIRECTORY, uuid, fileName);

                        // TODO: Upload 엔티티에 저장하고 uploadId 반환
                        Long uploadId = saveUploadRecord(albumId, userId, s3Key, fileName);

                        log.info("AI album cover generated successfully for album: {}, user: {}", albumId, userId);

                        return Mono.just(AlbumCoverUploadResponseDto.builder()
                                .uploadId(uploadId)
                                .presignedUrl(presignedUrl)
                                .s3Key(s3Key)
                                .originalFileName(fileName)
                                .build());

                    } catch (Exception e) {
                        log.error("Failed to process AI generated album cover for album: {}, user: {}", albumId, userId, e);
                        return Mono.error(new RuntimeException("AI 앨범 커버 처리 실패: " + e.getMessage(), e));
                    }
                });
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        // 파일 크기 제한 (10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
        }
    }

    private String saveTemporaryFile(MultipartFile file) throws IOException {
        String tempDir = System.getProperty("java.io.tmpdir");
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path tempFilePath = Paths.get(tempDir, fileName);

        Files.copy(file.getInputStream(), tempFilePath);

        return tempFilePath.toString();
    }

    private String saveBase64ImageToFile(String base64Image) throws IOException {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

        String tempDir = System.getProperty("java.io.tmpdir");
        String fileName = UUID.randomUUID().toString() + "_ai_generated.jpg";
        Path tempFilePath = Paths.get(tempDir, fileName);

        Files.write(tempFilePath, imageBytes);

        return tempFilePath.toString();
    }

    private Long saveUploadRecord(Long albumId, Long userId, String s3Key, String fileName) {
        // TODO: Upload 엔티티 구현 후 실제 DB 저장 로직 구현
        // 현재는 임시로 랜덤 ID 반환
        return Math.abs(UUID.randomUUID().hashCode()) % 1000000L;
    }
}