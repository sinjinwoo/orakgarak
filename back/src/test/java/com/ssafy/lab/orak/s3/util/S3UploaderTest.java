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
    private S3Helper s3Helper;

    @Mock
    private S3Presigner s3Presigner;

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
        
        doNothing().when(s3Helper).uploadToS3(eq(expectedS3Key), any());
        when(s3Helper.getS3Url(expectedS3Key))
            .thenReturn(expectedUrl);

        // when
        String result = s3Uploader.upload(testFilePath, directory);

        // then
        assertEquals(expectedUrl, result);
        
        verify(s3Helper).uploadToS3(eq(expectedS3Key), any());
        verify(s3Helper).getS3Url(expectedS3Key);
    }

    @Test
    @DisplayName("존재하지 않는 파일 업로드 시 예외 발생")
    void upload_FileNotExists_ThrowsException() {
        // given
        String nonExistentPath = "/path/to/nonexistent/file.mp3";
        String directory = "recordings";
        
        // Mock S3Helper to throw exception when uploading non-existent file
        doThrow(new RuntimeException("파일을 찾을 수 없습니다"))
            .when(s3Helper).uploadToS3(anyString(), any());

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.upload(nonExistentPath, directory)
        );

        verify(s3Helper).uploadToS3(anyString(), any());
    }

    @Test
    @DisplayName("S3 업로드 실패 시 예외 발생")
    void upload_S3UploadFails_ThrowsException() {
        // given
        String directory = "recordings";
        String s3Key = "recordings/test-audio.mp3";
        
        doThrow(new RuntimeException("S3 upload failed")).when(s3Helper).uploadToS3(eq(s3Key), any());

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.upload(testFilePath, directory)
        );

        verify(s3Helper).uploadToS3(eq(s3Key), any());
        verify(s3Helper, never()).getS3Url(any());
    }

    @Test
    @DisplayName("Presigned URL 생성 성공 테스트")
    void generatePresignedUrl_Success() {
        // given
        String directory = "recordings";
        String uuid = "test-uuid";
        String fileName = "test-audio.mp3";
        Duration duration = Duration.ofHours(1);
        String expectedS3Key = "recordings/test-uuid_test-audio.mp3";
        String expectedUrl = "https://presigned-url.com";

        when(s3Helper.createPresignedUrl(expectedS3Key, duration, s3Presigner))
            .thenReturn(expectedUrl);

        // when
        String result = s3Uploader.generatePresignedUrl(directory, uuid, fileName, duration);

        // then
        assertEquals(expectedUrl, result);
        
        verify(s3Helper).createPresignedUrl(expectedS3Key, duration, s3Presigner);
    }

    @Test
    @DisplayName("다중 Presigned URL 생성 성공 테스트")
    void generatePresignedUrls_Success() {
        // given
        String directory = "recordings";
        List<String> fileNames = Arrays.asList("audio1.mp3", "audio2.mp3");
        Duration duration = Duration.ofHours(2);

        // Mock createPresignedUrl to return URLs for any UUID-based key
        when(s3Helper.createPresignedUrl(anyString(), eq(duration), eq(s3Presigner)))
            .thenReturn("https://presigned1.com")
            .thenReturn("https://presigned2.com");

        // when
        List<String> results = s3Uploader.generatePresignedUrls(directory, fileNames, duration);

        // then
        assertNotNull(results);
        assertEquals(2, results.size());
        assertEquals("https://presigned1.com", results.get(0));
        assertEquals("https://presigned2.com", results.get(1));

        verify(s3Helper, times(2)).createPresignedUrl(anyString(), eq(duration), eq(s3Presigner));
    }

    @Test
    @DisplayName("단일 파일 삭제 성공 테스트")
    void removeS3File_Success() {
        // given
        String storedFileName = "uuid_test-audio.mp3";
        doNothing().when(s3Helper).deleteFromS3(storedFileName);

        // when & then
        assertDoesNotThrow(() -> s3Uploader.removeS3File(storedFileName));

        verify(s3Helper).deleteFromS3(storedFileName);
    }

    @Test
    @DisplayName("파일 삭제 실패 시 예외 발생")
    void removeS3File_DeleteFails_ThrowsException() {
        // given
        String storedFileName = "uuid_test-audio.mp3";
        doThrow(new RuntimeException("S3 delete failed")).when(s3Helper).deleteFromS3(storedFileName);

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.removeS3File(storedFileName)
        );

        verify(s3Helper).deleteFromS3(storedFileName);
    }

    @Test
    @DisplayName("다중 파일 삭제 성공 테스트")
    void removeS3Files_Success() {
        // given
        List<String> storedFileNames = Arrays.asList("uuid1_audio1.mp3", "uuid2_audio2.mp3");
        doNothing().when(s3Helper).deleteFromS3("uuid1_audio1.mp3");
        doNothing().when(s3Helper).deleteFromS3("uuid2_audio2.mp3");

        // when & then
        assertDoesNotThrow(() -> s3Uploader.removeS3Files(storedFileNames));

        verify(s3Helper, times(2)).deleteFromS3(anyString());
    }

    @Test
    @DisplayName("다중 파일 삭제 중 일부 실패 시 예외 발생")
    void removeS3Files_PartialFailure_ThrowsException() {
        // given
        List<String> storedFileNames = Arrays.asList("uuid1_audio1.mp3", "uuid2_audio2.mp3");
        doNothing().when(s3Helper).deleteFromS3("uuid1_audio1.mp3");
        doThrow(new RuntimeException("Delete failed")).when(s3Helper).deleteFromS3("uuid2_audio2.mp3");

        // when & then
        assertThrows(RuntimeException.class, () -> 
            s3Uploader.removeS3Files(storedFileNames)
        );

        verify(s3Helper, times(2)).deleteFromS3(anyString());
    }

    @Test
    @DisplayName("빈 파일명 리스트로 다중 삭제 시 정상 처리")
    void removeS3Files_EmptyList_NoError() {
        // given
        List<String> emptyList = Arrays.asList();

        // when & then
        assertDoesNotThrow(() -> s3Uploader.removeS3Files(emptyList));

        verify(s3Helper, never()).deleteFromS3(anyString());
    }
}