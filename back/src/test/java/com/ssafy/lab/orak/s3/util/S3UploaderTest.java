package com.ssafy.lab.orak.s3.util;

import com.ssafy.lab.orak.s3.helper.S3Helper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("S3Uploader 단위 테스트")
class S3UploaderTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private S3Helper s3Helper;

    @InjectMocks
    private S3Uploader s3Uploader;

    @TempDir
    Path tempDir;

    private File testFile;
    private String testFilePath;

    @BeforeEach
    void setUp() throws IOException {
        // 테스트용 파일 생성
        testFile = tempDir.resolve("test-audio.mp3").toFile();
        Files.write(testFile.toPath(), "test audio content".getBytes());
        testFilePath = testFile.getAbsolutePath();
    }

    @Test
    @DisplayName("파일 업로드 성공 테스트")
    void upload_Success() {
        // given
        String directory = "recordings";
        String expectedS3Key = "recordings/test-audio.mp3";
        String expectedUrl = "https://bucket.s3.amazonaws.com/" + expectedS3Key;
        
        when(s3Helper.getS3Url(expectedS3Key))
            .thenReturn(expectedUrl);

        // when
        String result = s3Uploader.upload(testFilePath, directory);

        // then
        assertEquals(expectedUrl, result);
        
        verify(s3Helper).getS3Url(expectedS3Key);
    }

    @Test
    @DisplayName("존재하지 않는 파일 업로드 시 예외 발생")
    void upload_FileNotExists_ThrowsException() {
        // given
        String nonExistentPath = "/path/to/nonexistent/file.mp3";
        String directory = "recordings";

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.upload(nonExistentPath, directory)
        );
    }

    @Test
    @DisplayName("S3 업로드 실패 시 예외 발생")
    void upload_S3UploadFails_ThrowsException() {
        // given
        String directory = "recordings";
        
        // S3Client가 예외를 던지도록 Mock 설정
        doThrow(new RuntimeException("S3 upload failed")).when(s3Client).putObject(any(PutObjectRequest.class), any(java.nio.file.Path.class));

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.upload(testFilePath, directory)
        );
    }

    @Test
    @DisplayName("Presigned URL 생성 성공 테스트")
    void generatePresignedUrl_Success() throws Exception {
        // given
        String directory = "recordings";
        String uuid = "test-uuid";
        String fileName = "test-audio.mp3";
        Duration duration = Duration.ofHours(1);
        String expectedUrl = "https://presigned-url.com";

        // Mock PresignedPutObjectRequest
        software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest mockRequest = 
            mock(software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest.class);
        when(mockRequest.url()).thenReturn(new java.net.URL(expectedUrl));
        when(s3Presigner.presignPutObject(any(software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest.class))).thenReturn(mockRequest);

        // when
        String result = s3Uploader.generatePresignedUrl(directory, uuid, fileName, duration);

        // then
        assertEquals(expectedUrl, result);
    }

    @Test
    @DisplayName("단일 파일 삭제 성공 테스트")
    void removeS3File_Success() {
        // given
        String storedFileName = "uuid_test-audio.mp3";

        // when & then
        assertDoesNotThrow(() -> s3Uploader.removeS3File(storedFileName));
    }

    @Test
    @DisplayName("파일 삭제 실패 시 예외 발생")
    void removeS3File_DeleteFails_ThrowsException() {
        // given
        String storedFileName = "uuid_test-audio.mp3";
        doThrow(new RuntimeException("S3 delete failed")).when(s3Client).deleteObject(any(DeleteObjectRequest.class));

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.removeS3File(storedFileName)
        );
    }
}