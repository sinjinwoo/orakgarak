package com.ssafy.lab.orak.upload.service;

import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.s3.util.S3Uploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.exception.UploadNotFoundException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
@DisplayName("FileUploadService 단위 테스트")
class FileUploadServiceTest {

    @Mock
    private S3Helper s3Helper;

    @Mock
    private LocalUploader localUploader;

    @Mock
    private S3Uploader s3Uploader;

    @Mock
    private UploadRepository uploadRepository;

    @InjectMocks
    private FileUploadService fileUploadService;

    private MultipartFile testFile;
    private Upload testUpload;

    @BeforeEach
    void setUp() {
        testFile = new MockMultipartFile(
            "audioFile",
            "test.mp3",
            "audio/mpeg",
            "test audio content".getBytes()
        );

        testUpload = Upload.builder()
            .id(1L)
            .originalFilename("test.mp3")
            .uuid("uuid_test")
            .extension("mp3")
            .uploaderId(1L)
            .fileSize(1024L)
            .contentType("audio/mpeg")
            .directory("recordings")
            .build();
    }

    @Test
    @DisplayName("단일 파일 업로드 성공 테스트")
    void uploadSingleFile_Success() throws Exception {
        // given
        Long userId = 1L;
        String directory = "recordings";
        String localPath = "/tmp/test.mp3";
        String s3Url = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";

        when(localUploader.uploadLocal(eq(testFile), anyString())).thenReturn(localPath);
        when(s3Uploader.upload(localPath, directory)).thenReturn(s3Url);
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // when
        Upload result = fileUploadService.uploadSingleFile(testFile, directory, userId);

        // then
        assertNotNull(result);
        assertEquals(testUpload.getId(), result.getId());
        assertEquals(testUpload.getOriginalFilename(), result.getOriginalFilename());
        
        verify(localUploader).uploadLocal(eq(testFile), anyString());
        verify(s3Uploader).upload(localPath, directory);
        verify(uploadRepository).save(any(Upload.class));
    }

    @Test
    @DisplayName("파일 사이즈가 올바르게 저장되는지 테스트")
    void uploadSingleFile_FileSizeIsSaved() throws Exception {
        // given
        Long userId = 1L;
        String directory = "recordings";
        String localPath = "/tmp/test.mp3";
        String s3Url = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";
        
        // Create a file with specific size
        MockMultipartFile testFileWithSize = new MockMultipartFile(
            "audioFile",
            "test.mp3",
            "audio/mpeg",
            "test audio content with specific size".getBytes() // 34 bytes
        );

        when(localUploader.uploadLocal(eq(testFileWithSize), anyString())).thenReturn(localPath);
        when(s3Uploader.upload(localPath, directory)).thenReturn(s3Url);
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // Use ArgumentCaptor to capture the Upload entity being saved
        ArgumentCaptor<Upload> uploadCaptor = ArgumentCaptor.forClass(Upload.class);

        // when
        fileUploadService.uploadSingleFile(testFileWithSize, directory, userId);

        // then
        verify(uploadRepository).save(uploadCaptor.capture());
        Upload capturedUpload = uploadCaptor.getValue();
        
        // Verify that fileSize matches the MultipartFile size
        assertEquals(testFileWithSize.getSize(), capturedUpload.getFileSize());
        assertEquals("test", capturedUpload.getOriginalFilename());
        assertEquals("audio/mpeg", capturedUpload.getContentType());
        assertEquals(userId, capturedUpload.getUploaderId());
        assertEquals(directory, capturedUpload.getDirectory());
    }

    @Test
    @DisplayName("빈 파일 업로드 시 예외 발생")
    void uploadSingleFile_EmptyFile_ThrowsException() {
        // given
        MultipartFile emptyFile = new MockMultipartFile("file", "", "text/plain", new byte[0]);
        Long userId = 1L;
        String directory = "recordings";

        // when & then
        assertThrows(FileUploadException.class, () -> 
            fileUploadService.uploadSingleFile(emptyFile, directory, userId)
        );

        verify(localUploader, never()).uploadLocal(any(), anyString());
        verify(s3Uploader, never()).upload(any(), any());
        verify(uploadRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3 업로드 실패 시 예외 발생")
    void uploadSingleFile_S3UploadFails_ThrowsException() throws Exception {
        // given
        Long userId = 1L;
        String directory = "recordings";
        String localPath = "/tmp/test.mp3";

        when(localUploader.uploadLocal(eq(testFile), anyString())).thenReturn(localPath);
        when(s3Uploader.upload(localPath, directory)).thenThrow(new RuntimeException("S3 upload failed"));

        // when & then
        assertThrows(FileUploadException.class, () -> 
            fileUploadService.uploadSingleFile(testFile, directory, userId)
        );

        verify(localUploader).uploadLocal(eq(testFile), anyString());
        verify(s3Uploader).upload(localPath, directory);
        verify(uploadRepository, never()).save(any());
    }

    @Test
    @DisplayName("다중 파일 업로드 성공 테스트")
    void uploadFiles_Success() throws Exception {
        // given
        Long userId = 1L;
        String directory = "recordings";
        MultipartFile file2 = new MockMultipartFile("file2", "test2.mp3", "audio/mpeg", "test audio 2".getBytes());
        List<MultipartFile> files = Arrays.asList(testFile, file2);
        
        String localPath = "/tmp/test.mp3";
        String s3Url = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";

        when(localUploader.uploadLocal(any(), anyString())).thenReturn(localPath);
        when(s3Uploader.upload(any(), eq(directory))).thenReturn(s3Url);
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // when
        List<Upload> results = fileUploadService.uploadFiles(files, directory, userId);

        // then
        assertNotNull(results);
        assertEquals(2, results.size());
        
        verify(localUploader, times(2)).uploadLocal(any(), anyString());
        verify(s3Uploader, times(2)).upload(any(), eq(directory));
        verify(uploadRepository, times(2)).save(any(Upload.class));
    }

    @Test
    @DisplayName("파일 삭제 성공 테스트")
    void deleteFile_Success() {
        // given
        Long uploadId = 1L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));
        doNothing().when(s3Uploader).removeS3File(testUpload.getFullPath());
        doNothing().when(uploadRepository).delete(testUpload);

        // when & then
        assertDoesNotThrow(() -> fileUploadService.deleteFile(uploadId));

        verify(uploadRepository).findById(uploadId);
        verify(s3Uploader).removeS3File(testUpload.getFullPath());
        verify(uploadRepository).delete(testUpload);
    }

    @Test
    @DisplayName("존재하지 않는 파일 삭제 시 예외 발생")
    void deleteFile_NotFound_ThrowsException() {
        // given
        Long uploadId = 999L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(UploadNotFoundException.class, () -> 
            fileUploadService.deleteFile(uploadId)
        );

        verify(uploadRepository).findById(uploadId);
        verify(s3Uploader, never()).removeS3File(any());
        verify(uploadRepository, never()).delete(any());
    }

    @Test
    @DisplayName("S3 파일 삭제 실패 시 예외 발생")
    void deleteFile_S3DeleteFails_ThrowsException() {
        // given
        Long uploadId = 1L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));
        doThrow(new RuntimeException("S3 delete failed")).when(s3Uploader).removeS3File(testUpload.getFullPath());

        // when & then
        assertThrows(FileUploadException.class, () -> 
            fileUploadService.deleteFile(uploadId)
        );

        verify(uploadRepository).findById(uploadId);
        verify(s3Uploader).removeS3File(testUpload.getFullPath());
        verify(uploadRepository, never()).delete(any());
    }

    @Test
    @DisplayName("업로드 조회 성공 테스트")
    void getUpload_Success() {
        // given
        Long uploadId = 1L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));

        // when
        Upload result = fileUploadService.getUpload(uploadId);

        // then
        assertNotNull(result);
        assertEquals(testUpload.getId(), result.getId());
        assertEquals(testUpload.getOriginalFilename(), result.getOriginalFilename());

        verify(uploadRepository).findById(uploadId);
    }

    @Test
    @DisplayName("존재하지 않는 업로드 조회 시 예외 발생")
    void getUpload_NotFound_ThrowsException() {
        // given
        Long uploadId = 999L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(UploadNotFoundException.class, () -> 
            fileUploadService.getUpload(uploadId)
        );

        verify(uploadRepository).findById(uploadId);
    }

    @Test
    @DisplayName("파일 URL 생성 테스트")
    void getFileUrl_Success() {
        // given
        String expectedUrl = "https://bucket.s3.amazonaws.com/recordings/uuid_test_test.mp3?presigned=true";
        String s3Key = testUpload.getFullPath();
        
        when(s3Helper.generatePresignedUrl(s3Key)).thenReturn(expectedUrl);

        // when
        String result = fileUploadService.getFileUrl(testUpload);

        // then
        assertEquals(expectedUrl, result);
        verify(s3Helper).generatePresignedUrl(s3Key);
    }

    @Test
    @DisplayName("ID로 파일 URL 생성 테스트")
    void getFileUrlById_Success() {
        // given
        Long uploadId = 1L;
        String expectedUrl = "https://bucket.s3.amazonaws.com/recordings/uuid_test_test.mp3?presigned=true";
        String s3Key = testUpload.getFullPath();
        
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));
        when(s3Helper.generatePresignedUrl(s3Key)).thenReturn(expectedUrl);

        // when
        String result = fileUploadService.getFileUrl(uploadId);

        // then
        assertEquals(expectedUrl, result);
        verify(uploadRepository).findById(uploadId);
        verify(s3Helper).generatePresignedUrl(s3Key);
    }

    @Test
    @DisplayName("URL 생성 실패 시 S3UrlGenerationException 발생 테스트")
    void getFileUrl_S3GenerationFails_ThrowsException() {
        // given
        String s3Key = testUpload.getFullPath();
        
        when(s3Helper.generatePresignedUrl(s3Key))
                .thenThrow(new S3UrlGenerationException(s3Key, "AWS 자격 증명 오류"));

        // when & then
        S3UrlGenerationException exception = assertThrows(S3UrlGenerationException.class, () -> 
                fileUploadService.getFileUrl(testUpload)
        );
        
        assertEquals(s3Key, exception.getS3Key());
        assertTrue(exception.getMessage().contains("AWS 자격 증명 오류"));
        verify(s3Helper).generatePresignedUrl(s3Key);
    }

    @Test
    @DisplayName("존재하지 않는 업로드 ID로 URL 생성 시 UploadNotFoundException 발생")
    void getFileUrlById_UploadNotFound_ThrowsException() {
        // given
        Long nonExistentUploadId = 999L;
        
        when(uploadRepository.findById(nonExistentUploadId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(UploadNotFoundException.class, () -> 
                fileUploadService.getFileUrl(nonExistentUploadId)
        );
        
        verify(uploadRepository).findById(nonExistentUploadId);
        verify(s3Helper, never()).generatePresignedUrl(any());
    }
}