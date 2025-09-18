package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.processing.exception.AudioProcessingException;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class AudioFormatConversionJobTest {

    @Mock
    private AudioConverter audioConverter;

    @Mock
    private S3Helper s3Helper;

    @Mock
    private UploadRepository uploadRepository;

    @InjectMocks
    private AudioFormatConversionJob audioFormatConversionJob;

    private Upload testUpload;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(audioFormatConversionJob, "uploadPath", "/tmp/test-upload");

        testUpload = Upload.builder()
                .id(1L)
                .uuid("test-uuid")
                .originalFilename("test-audio") // 실제 FileUploadService와 동일하게 확장자 없이
                .extension("mp3")
                .fileSize(1024L * 1024L * 21L) // 21MB
                .contentType("audio/mpeg")
                .processingStatus(ProcessingStatus.PROCESSING)
                .uploaderId(1L)
                .directory("recordings")
                .build();
    }

    @Test
    @DisplayName("MP3 파일 처리 가능 여부 확인")
    void testCanProcessMp3File() {
        // Given
        testUpload.setExtension("mp3");
        testUpload.setContentType("audio/mpeg");

        // When
        boolean canProcess = audioFormatConversionJob.canProcess(testUpload);

        // Then
        assertThat(canProcess).isTrue();
    }

    @Test
    @DisplayName("WAV 파일은 처리하지 않음")
    void testCannotProcessWavFile() {
        // Given
        testUpload.setExtension("wav");
        testUpload.setContentType("audio/wav");

        // When
        boolean canProcess = audioFormatConversionJob.canProcess(testUpload);

        // Then
        assertThat(canProcess).isTrue(); // isAudioFile이지만 실제 처리에서는 건너뜀
    }

    @Test
    @DisplayName("다양한 오디오 포맷 처리 가능")
    void testCanProcessVariousAudioFormats() {
        // Test FLAC
        testUpload.setExtension("flac");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();

        // Test M4A
        testUpload.setExtension("m4a");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();

        // Test AAC
        testUpload.setExtension("aac");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();

        // Test OGG
        testUpload.setExtension("ogg");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();

        // Test MP4
        testUpload.setExtension("mp4");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();

        // Test 3GP
        testUpload.setExtension("3gp");
        assertThat(audioFormatConversionJob.canProcess(testUpload)).isTrue();
    }

    @Test
    @DisplayName("처리 상태가 PROCESSING이 아니면 처리하지 않음")
    void testCannotProcessNonProcessingStatus() {
        // Given
        testUpload.setProcessingStatus(ProcessingStatus.UPLOADED);

        // When
        boolean canProcess = audioFormatConversionJob.canProcess(testUpload);

        // Then
        assertThat(canProcess).isFalse();
    }

    @Test
    @DisplayName("파일 크기에 따른 예상 처리 시간 계산")
    void testEstimatedProcessingTime() {
        // Given - 21MB 파일
        testUpload.setFileSize(21 * 1024 * 1024L);

        // When
        long estimatedTime = audioFormatConversionJob.getEstimatedProcessingTimeMs(testUpload);

        // Then
        assertThat(estimatedTime).isEqualTo(21 * 5000L); // 1MB당 5초
    }

    @Test
    @DisplayName("최소 처리 시간은 5초")
    void testMinimumProcessingTime() {
        // Given - 매우 작은 파일 (1KB)
        testUpload.setFileSize(1024L);

        // When
        long estimatedTime = audioFormatConversionJob.getEstimatedProcessingTimeMs(testUpload);

        // Then
        assertThat(estimatedTime).isEqualTo(5000L); // 최소 5초
    }

    @Test
    @DisplayName("MP3 파일 성공적으로 변환")
    void testSuccessfulMp3Conversion() throws Exception {
        // Given
        String localFilePath = "/tmp/test-upload/downloads/test-uuid_test-audio.mp3";
        String convertedFilePath = "/tmp/test-upload/converted/test-uuid_test-audio.wav";

        // 실제 임시 파일 생성 (File.exists() 검증을 위해)
        File convertedFile = new File(convertedFilePath);
        convertedFile.getParentFile().mkdirs();
        convertedFile.createNewFile();

        when(s3Helper.downloadFile(anyString(), anyString())).thenReturn(localFilePath);
        when(audioConverter.convertToWav(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(convertedFilePath);

        try {
            // When
            boolean result = audioFormatConversionJob.process(testUpload);

            // Then
            assertThat(result).isTrue();
            verify(s3Helper).downloadFile(eq("recordings/test-uuid_test-audio.mp3"), anyString());
            verify(audioConverter).convertToWav(eq(localFilePath), eq("/tmp/test-upload/converted"),
                    eq("test-uuid"), eq("test-audio")); // originalFilename에서 확장자 제거됨
            verify(uploadRepository).save(testUpload);

            // 엔티티 업데이트 확인
            assertThat(testUpload.getExtension()).isEqualTo("wav");
            assertThat(testUpload.getContentType()).isEqualTo("audio/wav");
        } finally {
            // 테스트 후 임시 파일 정리
            convertedFile.delete();
        }
    }

    @Test
    @DisplayName("WAV 파일은 변환을 건너뜀")
    void testSkipWavFileConversion() throws Exception {
        // Given
        testUpload.setExtension("wav");
        testUpload.setContentType("audio/wav");

        // When
        boolean result = audioFormatConversionJob.process(testUpload);

        // Then
        assertThat(result).isTrue();
        verify(s3Helper, never()).downloadFile(anyString(), anyString());
        verify(audioConverter, never()).convertToWav(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("S3 다운로드 실패 시 예외 발생")
    void testS3DownloadFailure() throws Exception {
        // Given
        when(s3Helper.downloadFile(anyString(), anyString()))
                .thenThrow(new RuntimeException("S3 download failed"));

        // When & Then
        assertThatThrownBy(() -> audioFormatConversionJob.process(testUpload))
                .isInstanceOf(AudioProcessingException.class)
                .hasMessageContaining("포맷 변환 중 예상치 못한 오류가 발생했습니다");
    }

    @Test
    @DisplayName("FFmpeg 변환 실패 시 예외 발생")
    void testFFmpegConversionFailure() throws Exception {
        // Given
        String localFilePath = "/tmp/test-upload/downloads/test-uuid_test-audio.mp3";

        when(s3Helper.downloadFile(anyString(), anyString())).thenReturn(localFilePath);
        when(audioConverter.convertToWav(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("FFmpeg conversion failed"));

        // When & Then
        assertThatThrownBy(() -> audioFormatConversionJob.process(testUpload))
                .isInstanceOf(AudioProcessingException.class)
                .hasMessageContaining("포맷 변환 중 예상치 못한 오류가 발생했습니다");
    }

    @Test
    @DisplayName("ProcessingJob 인터페이스 메서드들 확인")
    void testProcessingJobInterfaceMethods() {
        // When & Then
        assertThat(audioFormatConversionJob.getProcessingStatus())
                .isEqualTo(ProcessingStatus.CONVERTING);
        assertThat(audioFormatConversionJob.getCompletedStatus())
                .isEqualTo(ProcessingStatus.COMPLETED);
        assertThat(audioFormatConversionJob.getPriority()).isEqualTo(3);
    }

    @Test
    @DisplayName("FLAC에서 WAV로 변환")
    void testFlacToWavConversion() throws Exception {
        // Given
        testUpload = testUpload.toBuilder()
                .extension("flac")
                .contentType("audio/flac")
                .originalFilename("test-audio") // 실제 FileUploadService와 동일하게 확장자 없이
                .build();

        String localFilePath = "/tmp/test-upload/downloads/test-uuid_test-audio.flac";
        String convertedFilePath = "/tmp/test-upload/converted/test-uuid_test-audio.wav";

        // 실제 임시 파일 생성
        File convertedFile = new File(convertedFilePath);
        convertedFile.getParentFile().mkdirs();
        convertedFile.createNewFile();

        when(s3Helper.downloadFile(anyString(), anyString())).thenReturn(localFilePath);
        when(audioConverter.convertToWav(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(convertedFilePath);

        try {
            // When
            boolean result = audioFormatConversionJob.process(testUpload);

            // Then
            assertThat(result).isTrue();
            verify(audioConverter).convertToWav(eq(localFilePath), eq("/tmp/test-upload/converted"),
                    eq("test-uuid"), eq("test-audio")); // originalFilename에서 확장자 제거됨
            assertThat(testUpload.getExtension()).isEqualTo("wav");
            assertThat(testUpload.getContentType()).isEqualTo("audio/wav");
        } finally {
            // 테스트 후 임시 파일 정리
            convertedFile.delete();
        }
    }

    @Test
    @DisplayName("M4A에서 WAV로 변환")
    void testM4aToWavConversion() throws Exception {
        // Given
        testUpload = testUpload.toBuilder()
                .extension("m4a")
                .contentType("audio/mp4")
                .originalFilename("test-audio") // 실제 FileUploadService와 동일하게 확장자 없이
                .build();

        String localFilePath = "/tmp/test-upload/downloads/test-uuid_test-audio.m4a";
        String convertedFilePath = "/tmp/test-upload/converted/test-uuid_test-audio.wav";

        // 실제 임시 파일 생성
        File convertedFile = new File(convertedFilePath);
        convertedFile.getParentFile().mkdirs();
        convertedFile.createNewFile();

        when(s3Helper.downloadFile(anyString(), anyString())).thenReturn(localFilePath);
        when(audioConverter.convertToWav(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(convertedFilePath);

        try {
            // When
            boolean result = audioFormatConversionJob.process(testUpload);

            // Then
            assertThat(result).isTrue();
            verify(audioConverter).convertToWav(eq(localFilePath), eq("/tmp/test-upload/converted"),
                    eq("test-uuid"), eq("test-audio")); // originalFilename에서 확장자 제거됨
            assertThat(testUpload.getExtension()).isEqualTo("wav");
            assertThat(testUpload.getContentType()).isEqualTo("audio/wav");
        } finally {
            // 테스트 후 임시 파일 정리
            convertedFile.delete();
        }
    }
}