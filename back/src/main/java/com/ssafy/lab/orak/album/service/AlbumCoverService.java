package com.ssafy.lab.orak.album.service;

import com.ssafy.lab.orak.ai.dto.RecordDataDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationRequestDto;
import com.ssafy.lab.orak.ai.service.PythonAiService;
import com.ssafy.lab.orak.album.dto.AlbumCoverGenerateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumCoverUploadResponseDto;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class AlbumCoverService {

    private final FileUploadService fileUploadService;
    private final S3Helper s3Helper;
    private final PythonAiService pythonAiService;

    private static final String ALBUM_COVER_DIRECTORY = "album-covers";
    private static final Duration PRESIGNED_URL_DURATION = Duration.ofHours(1);

    public AlbumCoverUploadResponseDto uploadAlbumCover(Long userId, MultipartFile file) {
        validateImageFile(file);

        try {
            // FileUploadService를 사용하여 표준 업로드 프로세스 진행
            Upload upload = fileUploadService.uploadSingleFile(file, ALBUM_COVER_DIRECTORY, userId);

            // Presigned URL 생성 (24시간 유효)
            String presignedUrl = s3Helper.generatePresignedUrl(upload.getFullPath(), Duration.ofHours(24));

            log.info("Album cover uploaded successfully for user: {} with upload ID: {}", userId, upload.getId());

            return AlbumCoverUploadResponseDto.builder()
                    .uploadId(upload.getId())
                    .presignedUrl(presignedUrl)
                    .s3Key(upload.getFullPath())
                    .originalFileName(upload.getOriginalFilename() + "." + upload.getExtension())
                    .build();

        } catch (Exception e) {
            log.error("Failed to upload album cover for user: {}", userId, e);
            throw new RuntimeException("앨범 커버 업로드 실패: " + e.getMessage(), e);
        }
    }

    public Mono<AlbumCoverUploadResponseDto> generateAlbumCover(Long userId, AlbumCoverGenerateRequestDto request) {
        log.info("Starting AI album cover generation for user: {} with upload IDs: {}", userId, request.uploadIds());

        // 1. 업로드 ID로 직접 파일 정보 조회
        List<RecordDataDto> recordDataList;
        try {
            recordDataList = request.uploadIds().stream()
                    .map(uploadId -> {
                        try {
                            // Upload 엔티티에서 파일 정보 조회
                            Upload upload = fileUploadService.getUpload(uploadId);
                            String fileUrl = fileUploadService.getFileUrl(upload);

                            // Upload 정보를 RecordDataDto로 변환 (간단한 형태)
                            return RecordDataDto.builder()
                                    .id(uploadId.intValue()) // Upload ID를 임시로 사용
                                    .userId(upload.getUploaderId().intValue())
                                    .title(upload.getOriginalFilename()) // 파일명을 title로 사용
                                    .extension(upload.getExtension())
                                    .contentType(upload.getContentType())
                                    .fileSize(upload.getFileSize() + " bytes")
                                    .url(fileUrl)
                                    .urlStatus("SUCCESS")
                                    .uploadId(uploadId.intValue())
                                    .build();
                        } catch (Exception e) {
                            log.error("Failed to fetch upload data for ID: {}", uploadId, e);
                            throw new RuntimeException("업로드 데이터 조회 실패 (ID: " + uploadId + "): " + e.getMessage(), e);
                        }
                    })
                    .collect(Collectors.toList());

            log.info("Successfully fetched {} upload(s) for AI album cover generation", recordDataList.size());

        } catch (Exception e) {
            log.error("Failed to prepare AI album cover generation for user: {}", userId, e);
            return Mono.error(new RuntimeException("AI 앨범 커버 생성 준비 실패: " + e.getMessage(), e));
        }

        // 2. AI 서비스용 DTO 변환 (파라미터 고정)
        VoiceImageGenerationRequestDto aiRequest = VoiceImageGenerationRequestDto.builder()
                .records(recordDataList)
                .aspectRatio("1:1")                    // 고정값
                .safetyFilterLevel("block_most")       // 고정값
                .personGeneration("dont_allow")        // 고정값
                .build();

        return pythonAiService.generateVoiceImage(aiRequest)
                .flatMap(aiResponse -> {
                    if (!aiResponse.success()) {
                        return Mono.error(new RuntimeException("AI 이미지 생성 실패: " + aiResponse.error()));
                    }

                    try {
                        // Base64를 임시 파일로 직접 저장
                        byte[] imageBytes = Base64.getDecoder().decode(aiResponse.imageBase64());
                        String fileName = "ai_generated_cover.jpg";

                        // 1. 로컬에 임시 파일로 저장
                        String tempDir = System.getProperty("java.io.tmpdir");
                        String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;
                        Path tempFilePath = Paths.get(tempDir, uniqueFileName);
                        Files.write(tempFilePath, imageBytes);
                        String localFilePath = tempFilePath.toString();
                        log.info("Base64 이미지를 로컬 임시 파일로 저장: {}", localFilePath);

                        // 2. S3에 업로드 (Profile 방식)
                        Upload upload = fileUploadService.uploadLocalFile(localFilePath, ALBUM_COVER_DIRECTORY, userId, fileName);
                        log.info("로컬 파일을 S3에 업로드 완료: {}", upload.getFullPath());

                        // 3. 로컬 임시 파일 삭제
                        try {
                            Files.deleteIfExists(tempFilePath);
                            log.info("로컬 임시 파일 삭제 완료: {}", localFilePath);
                        } catch (IOException e) {
                            log.warn("로컬 임시 파일 삭제 실패: {}", localFilePath, e);
                        }

                        // 4. Presigned URL 생성 (Profile 방식)
                        String presignedUrl = s3Helper.generatePresignedUrl(upload.getFullPath(), Duration.ofHours(24));
                        log.info("Presigned URL 생성 완료: {}", upload.getFullPath());

                        log.info("AI album cover generated successfully for user: {} with upload ID: {}", userId, upload.getId());

                        return Mono.just(AlbumCoverUploadResponseDto.builder()
                                .uploadId(upload.getId())
                                .presignedUrl(presignedUrl)
                                .s3Key(upload.getFullPath())
                                .originalFileName(upload.getOriginalFilename() + "." + upload.getExtension())
                                .build());

                    } catch (Exception e) {
                        log.error("Failed to process AI generated album cover for user: {}", userId, e);
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

}