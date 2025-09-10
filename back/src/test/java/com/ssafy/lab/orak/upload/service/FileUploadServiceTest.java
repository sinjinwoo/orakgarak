package com.ssafy.lab.orak.upload.service;

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
            .storedFilename("uuid_test.mp3")
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
        List<String> localPaths = Arrays.asList("/tmp/test.mp3");
        String s3Url = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";
        String storedFilename = "uuid_test.mp3";

        when(localUploader.uploadLocal(testFile)).thenReturn(localPaths);
        when(s3Uploader.upload(localPaths.get(0), directory)).thenReturn(s3Url);
        when(s3Helper.extractFullFileNameFromUrl(s3Url)).thenReturn(storedFilename);
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // when
        Upload result = fileUploadService.uploadSingleFile(testFile, directory, userId);

        // then
        assertNotNull(result);
        assertEquals(testUpload.getId(), result.getId());
        assertEquals(testUpload.getOriginalFilename(), result.getOriginalFilename());
        
        verify(localUploader).uploadLocal(testFile);
        verify(s3Uploader).upload(localPaths.get(0), directory);
        verify(s3Helper).extractFullFileNameFromUrl(s3Url);
        verify(uploadRepository).save(any(Upload.class));
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

        verify(localUploader, never()).uploadLocal(any());
        verify(s3Uploader, never()).upload(any(), any());
        verify(uploadRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3 업로드 실패 시 예외 발생")
    void uploadSingleFile_S3UploadFails_ThrowsException() throws Exception {
        // given
        Long userId = 1L;
        String directory = "recordings";
        List<String> localPaths = Arrays.asList("/tmp/test.mp3");

        when(localUploader.uploadLocal(testFile)).thenReturn(localPaths);
        when(s3Uploader.upload(localPaths.get(0), directory)).thenThrow(new RuntimeException("S3 upload failed"));

        // when & then
        assertThrows(FileUploadException.class, () -> 
            fileUploadService.uploadSingleFile(testFile, directory, userId)
        );

        verify(localUploader).uploadLocal(testFile);
        verify(s3Uploader).upload(localPaths.get(0), directory);
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
        
        List<String> localPaths = Arrays.asList("/tmp/test.mp3");
        String s3Url = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";

        when(localUploader.uploadLocal(any())).thenReturn(localPaths);
        when(s3Uploader.upload(any(), eq(directory))).thenReturn(s3Url);
        when(s3Helper.extractFullFileNameFromUrl(any())).thenReturn("uuid_test.mp3");
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // when
        List<Upload> results = fileUploadService.uploadFiles(files, directory, userId);

        // then
        assertNotNull(results);
        assertEquals(2, results.size());
        
        verify(localUploader, times(2)).uploadLocal(any());
        verify(s3Uploader, times(2)).upload(any(), eq(directory));
        verify(uploadRepository, times(2)).save(any(Upload.class));
    }

    @Test
    @DisplayName("파일 삭제 성공 테스트")
    void deleteFile_Success() {
        // given
        Long uploadId = 1L;
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));
        doNothing().when(s3Uploader).removeS3File(testUpload.getStoredFilename());
        doNothing().when(uploadRepository).delete(testUpload);

        // when & then
        assertDoesNotThrow(() -> fileUploadService.deleteFile(uploadId));

        verify(uploadRepository).findById(uploadId);
        verify(s3Uploader).removeS3File(testUpload.getStoredFilename());
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
        doThrow(new RuntimeException("S3 delete failed")).when(s3Uploader).removeS3File(testUpload.getStoredFilename());

        // when & then
        assertThrows(FileUploadException.class, () -> 
            fileUploadService.deleteFile(uploadId)
        );

        verify(uploadRepository).findById(uploadId);
        verify(s3Uploader).removeS3File(testUpload.getStoredFilename());
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
        String expectedUrl = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";
        String s3Key = testUpload.getDirectory() + "/" + testUpload.getStoredFilename();
        
        when(s3Helper.getS3Url(s3Key)).thenReturn(expectedUrl);

        // when
        String result = fileUploadService.getFileUrl(testUpload);

        // then
        assertEquals(expectedUrl, result);
        verify(s3Helper).getS3Url(s3Key);
    }

    @Test
    @DisplayName("ID로 파일 URL 생성 테스트")
    void getFileUrlById_Success() {
        // given
        Long uploadId = 1L;
        String expectedUrl = "https://bucket.s3.amazonaws.com/recordings/uuid_test.mp3";
        String s3Key = testUpload.getDirectory() + "/" + testUpload.getStoredFilename();
        
        when(uploadRepository.findById(uploadId)).thenReturn(Optional.of(testUpload));
        when(s3Helper.getS3Url(s3Key)).thenReturn(expectedUrl);

        // when
        String result = fileUploadService.getFileUrl(uploadId);

        // then
        assertEquals(expectedUrl, result);
        verify(uploadRepository).findById(uploadId);
        verify(s3Helper).getS3Url(s3Key);
    }
}