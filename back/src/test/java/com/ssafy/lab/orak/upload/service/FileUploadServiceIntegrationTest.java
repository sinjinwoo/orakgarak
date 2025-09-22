package com.ssafy.lab.orak.upload.service;

import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FileUploadServiceIntegrationTest {

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private UploadRepository uploadRepository;

    @Autowired
    private S3Helper s3Helper;

    @Test
    @DisplayName("S3 Presigned URL 업로드 후 비동기 처리 파이프라인 테스트")
    void testPresignedUrlUploadPipeline() {
        // Given: 오디오 파일 준비
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio",
                "test-audio.mp3",
                "audio/mpeg",
                "audio file content".getBytes()
        );

        Long userId = 1L;
        String directory = "test-uploads";

        // When: 파일 업로드 (Presigned URL 방식 시뮬레이션)
        Upload uploadedFile = fileUploadService.uploadSingleFile(audioFile, directory, userId);

        // Then: 업로드 결과 검증
        assertNotNull(uploadedFile.getId());
        assertThat(uploadedFile.getOriginalFilename()).isEqualTo("test-audio");
        assertThat(uploadedFile.getExtension()).isEqualTo("mp3");
        assertThat(uploadedFile.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);

        // Presigned URL 생성 테스트
        String presignedUrl = fileUploadService.getFileUrl(uploadedFile);
        assertThat(presignedUrl).isNotEmpty();
        assertThat(presignedUrl).contains("amazonaws.com");

        System.out.println("✅ Presigned URL 생성 성공: " + presignedUrl);
    }

    @Test
    @DisplayName("배치 처리를 위한 대기 중인 파일 조회 테스트")
    void testGetPendingAudioProcessing() {
        // Given: 여러 개의 오디오 파일 업로드
        for (int i = 1; i <= 5; i++) {
            MockMultipartFile audioFile = new MockMultipartFile(
                    "audio" + i,
                    "test-audio-" + i + ".mp3",
                    "audio/mpeg",
                    ("audio file content " + i).getBytes()
            );

            fileUploadService.uploadSingleFile(audioFile, "test-batch", 1L);
        }

        // When: 배치 처리 대상 파일 조회 (최대 3개)
        List<Upload> pendingFiles = fileUploadService.getPendingAudioProcessing(3);

        // Then: 결과 검증
        assertThat(pendingFiles).hasSize(3);
        pendingFiles.forEach(upload -> {
            assertThat(upload.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);
            assertThat(upload.isAudioFile()).isTrue();
        });

        System.out.println("✅ 배치 처리 대상 파일 조회 성공: " + pendingFiles.size() + "개");
    }

    @Test
    @DisplayName("파일 타입별 초기 상태 설정 테스트")
    void testFileTypeBasedInitialStatus() {
        // Given: 다양한 타입의 파일 준비
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test.mp3", "audio/mpeg", "audio content".getBytes()
        );

        MockMultipartFile imageFile = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "image content".getBytes()
        );

        MockMultipartFile textFile = new MockMultipartFile(
                "text", "test.txt", "text/plain", "text content".getBytes()
        );

        // When: 각 파일 업로드
        Upload audioUpload = fileUploadService.uploadSingleFile(audioFile, "test", 1L);
        Upload imageUpload = fileUploadService.uploadSingleFile(imageFile, "test", 1L);
        Upload textUpload = fileUploadService.uploadSingleFile(textFile, "test", 1L);

        // Then: 파일 타입별 초기 상태 검증
        assertThat(audioUpload.isAudioFile()).isTrue();
        assertThat(audioUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);

        assertThat(imageUpload.isImageFile()).isTrue();
        assertThat(imageUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);

        assertThat(textUpload.isAudioFile()).isFalse();
        assertThat(textUpload.isImageFile()).isFalse();

        System.out.println("✅ 파일 타입별 초기 상태 설정 확인 완료");
    }

    @Test
    @DisplayName("처리 상태 업데이트 및 이력 관리 테스트")
    void testProcessingStatusUpdate() {
        // Given: 오디오 파일 업로드
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test-processing.mp3", "audio/mpeg", "audio content".getBytes()
        );

        Upload upload = fileUploadService.uploadSingleFile(audioFile, "test-processing", 1L);
        Long uploadId = upload.getId();

        // When & Then: 처리 상태 단계별 업데이트

        // 1. 처리 시작
        fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.PROCESSING);
        Upload processingUpload = fileUploadService.getUpload(uploadId);
        assertThat(processingUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.PROCESSING);

        // 2. 처리 완료
        fileUploadService.updateProcessingStatus(uploadId, ProcessingStatus.COMPLETED);
        Upload completedUpload = fileUploadService.getUpload(uploadId);
        assertThat(completedUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.COMPLETED);

        // 3. 처리 실패 테스트
        fileUploadService.markProcessingFailed(uploadId, "Test processing error");
        Upload failedUpload = fileUploadService.getUpload(uploadId);
        assertThat(failedUpload.getProcessingStatus()).isEqualTo(ProcessingStatus.FAILED);
        assertThat(failedUpload.getErrorMessage()).isEqualTo("Test processing error");

        System.out.println("✅ 처리 상태 업데이트 및 이력 관리 확인 완료");
    }

    @Test
    @DisplayName("로컬 파일에서 S3 업로드 테스트 (처리 결과물 업로드)")
    void testLocalFileToS3Upload() {
        // Given: 처리된 로컬 파일 시뮬레이션
        String localFilePath = System.getProperty("java.io.tmpdir") + "/test-processed-file.mp3";
        String originalFilename = "processed-audio.mp3";
        Long userId = 1L;
        String directory = "processed-files";

        // 실제 로컬 파일 생성 (테스트용)
        try {
            java.nio.file.Files.write(
                java.nio.file.Paths.get(localFilePath),
                "processed audio content".getBytes()
            );
        } catch (Exception e) {
            System.err.println("로컬 파일 생성 실패: " + e.getMessage());
            return;
        }

        // When: 로컬 파일을 S3에 업로드
        Upload upload = fileUploadService.uploadLocalFile(localFilePath, directory, userId, originalFilename);

        // Then: 업로드 결과 검증
        assertNotNull(upload.getId());
        assertThat(upload.getOriginalFilename()).isEqualTo("processed-audio");
        assertThat(upload.getExtension()).isEqualTo("mp3");
        assertThat(upload.getDirectory()).isEqualTo(directory);

        // 파일 URL 생성 확인
        String fileUrl = fileUploadService.getFileUrl(upload);
        assertThat(fileUrl).isNotEmpty();

        System.out.println("✅ 로컬 파일 → S3 업로드 확인 완료");

        // 정리: 테스트 파일 삭제
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(localFilePath));
        } catch (Exception e) {
            System.err.println("테스트 파일 정리 실패: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("동시 업로드 부하 테스트")
    void testConcurrentUpload() {
        // Given: 다수의 파일 동시 업로드
        java.util.List<MockMultipartFile> files = java.util.stream.IntStream.range(1, 11)
                .mapToObj(i -> new MockMultipartFile(
                        "file" + i,
                        "concurrent-test-" + i + ".mp3",
                        "audio/mpeg",
                        ("audio content " + i).getBytes()
                ))
                .collect(java.util.stream.Collectors.toList());

        // When: 배치 업로드
        List<MultipartFile> multipartFiles = files.stream()
            .map(f -> (MultipartFile) f)
            .collect(java.util.stream.Collectors.toList());
        List<Upload> uploadedFiles = fileUploadService.uploadFiles(multipartFiles, "concurrent-test", 1L);

        // Then: 업로드 결과 검증
        assertThat(uploadedFiles).hasSize(10);

        uploadedFiles.forEach(upload -> {
            assertNotNull(upload.getId());
            assertThat(upload.getProcessingStatus()).isEqualTo(ProcessingStatus.UPLOADED);
            assertThat(upload.getUploaderId()).isEqualTo(1L);
        });

        System.out.println("✅ 동시 업로드 부하 테스트 완료: " + uploadedFiles.size() + "개 파일");
    }
}