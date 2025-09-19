package com.ssafy.lab.orak.recording.service;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordOperationException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.mapper.RecordMapper;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.recording.util.AudioDurationCalculator;
import com.ssafy.lab.orak.s3.exception.S3UrlGenerationException;
import com.ssafy.lab.orak.s3.util.LocalUploader;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecordService 단위 테스트")
@org.springframework.test.context.TestPropertySource(properties = {
    "s3.upload.path=/test/upload/path"
})
class RecordServiceTest {

    @Mock
    private RecordRepository recordRepository;

    @Mock
    private FileUploadService fileUploadService;

    @Mock
    private RecordMapper recordMapper;

    @Mock
    private AudioConverter audioConverter;

    @Mock
    private LocalUploader localUploader;
    
    @Mock
    private AudioDurationCalculator audioDurationCalculator;

    @Mock
    private UploadRepository uploadRepository;

    @InjectMocks
    private RecordService recordService;

    private MultipartFile testAudioFile;
    private Upload testUpload;
    private Record testRecord;
    private RecordResponseDTO testResponseDTO;

    @BeforeEach
    void setUp() {
        // RecordService의 uploadPath 필드 설정
        ReflectionTestUtils.setField(recordService, "uploadPath", "/test/upload/path");
        
        testAudioFile = new MockMultipartFile(
            "audioFile",
            "test-recording.mp3",
            "audio/mpeg",
            "test audio content".getBytes()
        );

        testUpload = Upload.builder()
            .id(1L)
            .originalFilename("test-recording")
            .uuid("uuid_test-recording")
            .extension("mp3")
            .uploaderId(1L)
            .fileSize(2048L)
            .contentType("audio/mpeg")
            .directory("recordings")
            .build();

        testRecord = Record.builder()
            .id(1L)
            .userId(1L)
            .songId(100L)
            .title("테스트 녹음")
            .uploadId(1L)
            .durationSeconds(180)
            .build();

        testResponseDTO = RecordResponseDTO.builder()
            .id(1L)
            .userId(1L)
            .songId(100L)
            .title("테스트 녹음")
            .durationSeconds(180)
            .uploadId(1L)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("녹음 생성 성공 테스트")
    void createRecord_Success() {
        // given
        String title = "테스트 녹음";
        Long songId = 100L;
        Long userId = 1L;

        when(localUploader.uploadLocal(eq(testAudioFile), anyString()))
            .thenReturn("/test/path/test-recording.mp3");
        when(audioConverter.isAudioFile(anyString(), any()))
            .thenReturn(false); // Test non-audio file path
        when(audioDurationCalculator.calculateDurationInSeconds("/test/upload/path/uuid_test-recording_test-recording.mp3"))
            .thenReturn(180);
        when(fileUploadService.uploadLocalFile("/test/path/test-recording.mp3", "recordings", userId, "test-recording.mp3"))
            .thenReturn(testUpload);
        when(recordMapper.toEntity(any(RecordRequestDTO.class), eq(userId), eq(testUpload)))
            .thenReturn(testRecord);
        when(recordRepository.save(any(Record.class))).thenReturn(testRecord);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload)).thenReturn("https://presigned-url.example.com");
        when(uploadRepository.save(any(Upload.class))).thenReturn(testUpload);

        // when
        RecordResponseDTO result = recordService.createRecord(title, songId, testAudioFile, userId);

        // then
        assertNotNull(result);
        assertEquals(testResponseDTO.getId(), result.getId());
        assertEquals(testResponseDTO.getTitle(), result.getTitle());
        assertEquals(testResponseDTO.getUserId(), result.getUserId());

        verify(localUploader).uploadLocal(eq(testAudioFile), anyString());
        verify(audioConverter).isAudioFile(anyString(), any());
        verify(audioConverter, never()).convertToWav(anyString(), anyString()); // No conversion for non-audio
        verify(audioDurationCalculator).calculateDurationInSeconds("/test/upload/path/uuid_test-recording_test-recording.mp3");
        verify(fileUploadService).uploadLocalFile("/test/path/test-recording.mp3", "recordings", userId, "test-recording.mp3");
        verify(recordMapper).toEntity(any(RecordRequestDTO.class), eq(userId), eq(testUpload));
        verify(recordRepository).save(any(Record.class));
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("파일 업로드 실패 시 예외 발생")
    void createRecord_FileUploadFails_ThrowsException() {
        // given
        String title = "테스트 녹음";
        Long songId = 100L;
        Long userId = 1L;

        when(localUploader.uploadLocal(eq(testAudioFile), anyString()))
            .thenThrow(new RuntimeException("파일 업로드 실패"));

        // when & then
        assertThrows(RecordOperationException.class, () ->
            recordService.createRecord(title, songId, testAudioFile, userId)
        );

        verify(localUploader).uploadLocal(eq(testAudioFile), anyString());
        verify(recordRepository, never()).save(any());
    }

    @Test
    @DisplayName("녹음 조회 성공 테스트")
    void getRecord_Success() {
        // given
        Long recordId = 1L;
        when(recordRepository.findByIdWithUpload(recordId)).thenReturn(testRecord);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload)).thenReturn("https://presigned-url.example.com");

        // when
        RecordResponseDTO result = recordService.getRecord(recordId);

        // then
        assertNotNull(result);
        assertEquals(testResponseDTO.getId(), result.getId());
        assertEquals(testResponseDTO.getTitle(), result.getTitle());

        verify(recordRepository).findByIdWithUpload(recordId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 조회 시 예외 발생")
    void getRecord_NotFound_ThrowsException() {
        // given
        Long recordId = 999L;
        when(recordRepository.findByIdWithUpload(recordId)).thenReturn(null);

        // when & then
        assertThrows(RecordNotFoundException.class, () -> 
            recordService.getRecord(recordId)
        );

        verify(recordRepository).findByIdWithUpload(recordId);
        verify(recordMapper, never()).toResponseDTO(any());
    }

    @Test
    @DisplayName("사용자별 녹음 목록 조회 성공 테스트")
    void getRecordsByUser_Success() {
        // given
        Long userId = 1L;
        List<Record> records = Arrays.asList(testRecord);

        when(recordRepository.findByUserIdWithUpload(userId)).thenReturn(records);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload)).thenReturn("https://presigned-url.example.com");

        // when
        List<RecordResponseDTO> results = recordService.getRecordsByUser(userId);

        // then
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(testResponseDTO.getId(), results.get(0).getId());

        verify(recordRepository).findByUserIdWithUpload(userId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("곡별 녹음 목록 조회 성공 테스트")
    void getRecordsBySong_Success() {
        // given
        Long songId = 100L;
        List<Record> records = Arrays.asList(testRecord);

        when(recordRepository.findBySongId(songId)).thenReturn(records);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload)).thenReturn("https://presigned-url.example.com");

        // when
        List<RecordResponseDTO> results = recordService.getRecordsBySong(songId);

        // then
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(testResponseDTO.getSongId(), results.get(0).getSongId());

        verify(recordRepository).findBySongId(songId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("녹음 삭제 성공 테스트")
    void deleteRecord_Success() {
        // given
        Long recordId = 1L;
        Long userId = 1L;

        when(recordRepository.findById(recordId)).thenReturn(Optional.of(testRecord));
        doNothing().when(fileUploadService).deleteFile(testRecord.getUploadId());
        doNothing().when(recordRepository).delete(testRecord);

        // when & then
        assertDoesNotThrow(() -> recordService.deleteRecord(recordId, userId));

        verify(recordRepository).findById(recordId);
        verify(fileUploadService).deleteFile(testRecord.getUploadId());
        verify(recordRepository).delete(testRecord);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 삭제 시 예외 발생")
    void deleteRecord_NotFound_ThrowsException() {
        // given
        Long recordId = 999L;
        Long userId = 1L;

        when(recordRepository.findById(recordId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(RuntimeException.class, () -> 
            recordService.deleteRecord(recordId, userId)
        );

        verify(recordRepository).findById(recordId);
        verify(fileUploadService, never()).deleteFile(any());
        verify(recordRepository, never()).delete(any());
    }

    @Test
    @DisplayName("권한 없는 사용자의 녹음 삭제 시 예외 발생")
    void deleteRecord_PermissionDenied_ThrowsException() {
        // given
        Long recordId = 1L;
        Long userId = 2L; // 다른 사용자
        Record otherUserRecord = testRecord.toBuilder().userId(1L).build(); // 다른 사용자의 녹음

        when(recordRepository.findById(recordId)).thenReturn(Optional.of(otherUserRecord));

        // when & then
        assertThrows(RuntimeException.class, () -> 
            recordService.deleteRecord(recordId, userId)
        );

        verify(recordRepository).findById(recordId);
        verify(fileUploadService, never()).deleteFile(any());
        verify(recordRepository, never()).delete(any());
    }

    @Test
    @DisplayName("녹음 수정 성공 테스트")
    void updateRecord_Success() {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 녹음 제목";
        Long userId = 1L;
        Record updatedRecord = testRecord.toBuilder().title(newTitle).build();

        when(recordRepository.findById(recordId)).thenReturn(Optional.of(testRecord));
        when(recordRepository.save(any(Record.class))).thenReturn(updatedRecord);
        when(fileUploadService.getUpload(updatedRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(updatedRecord, testUpload)).thenReturn(
            testResponseDTO.toBuilder().title(newTitle).build()
        );
        when(fileUploadService.getFileUrl(testUpload)).thenReturn("https://presigned-url.example.com");

        // when
        RecordResponseDTO result = recordService.updateRecord(recordId, newTitle, null, userId);

        // then
        assertNotNull(result);
        assertEquals(newTitle, result.getTitle());

        verify(recordRepository).findById(recordId);
        verify(recordRepository).save(any(Record.class));
        verify(fileUploadService).getUpload(updatedRecord.getUploadId());
        verify(recordMapper).toResponseDTO(updatedRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 수정 시 예외 발생")
    void updateRecord_NotFound_ThrowsException() {
        // given
        Long recordId = 999L;
        String newTitle = "수정된 제목";
        Long userId = 1L;

        when(recordRepository.findById(recordId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(RuntimeException.class, () -> 
            recordService.updateRecord(recordId, newTitle, null, userId)
        );

        verify(recordRepository).findById(recordId);
        verify(recordRepository, never()).save(any());
    }

    @Test
    @DisplayName("권한 없는 사용자의 녹음 수정 시 예외 발생")
    void updateRecord_PermissionDenied_ThrowsException() {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 제목";
        Long userId = 2L; // 다른 사용자
        Record otherUserRecord = testRecord.toBuilder().userId(1L).build();

        when(recordRepository.findById(recordId)).thenReturn(Optional.of(otherUserRecord));

        // when & then
        assertThrows(RuntimeException.class, () -> 
            recordService.updateRecord(recordId, newTitle, null, userId)
        );

        verify(recordRepository).findById(recordId);
        verify(recordRepository, never()).save(any());
    }

    @Test
    @DisplayName("URL 생성 실패 시 urlStatus가 FAILED로 설정되는 테스트")
    void getRecord_UrlGenerationFails_ReturnsFailedStatus() {
        // given
        Long recordId = 1L;
        when(recordRepository.findByIdWithUpload(recordId)).thenReturn(testRecord);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload))
                .thenThrow(new S3UrlGenerationException("test-key", "S3 연결 실패"));

        // when
        RecordResponseDTO result = recordService.getRecord(recordId);

        // then
        assertNotNull(result);
        assertNull(result.getUrl());
        assertEquals("FAILED", result.getUrlStatus());

        verify(recordRepository).findByIdWithUpload(recordId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("예상치 못한 URL 생성 오류 시 urlStatus가 ERROR로 설정되는 테스트")
    void getRecord_UnexpectedUrlError_ReturnsErrorStatus() {
        // given
        Long recordId = 1L;
        when(recordRepository.findByIdWithUpload(recordId)).thenReturn(testRecord);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload))
                .thenThrow(new RuntimeException("네트워크 연결 오류"));

        // when
        RecordResponseDTO result = recordService.getRecord(recordId);

        // then
        assertNotNull(result);
        assertNull(result.getUrl());
        assertEquals("ERROR", result.getUrlStatus());

        verify(recordRepository).findByIdWithUpload(recordId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }

    @Test
    @DisplayName("URL 생성 성공 시 urlStatus가 SUCCESS로 설정되는 테스트")
    void getRecord_UrlGenerationSuccess_ReturnsSuccessStatus() {
        // given
        Long recordId = 1L;
        String expectedUrl = "https://presigned-url.example.com";
        
        when(recordRepository.findByIdWithUpload(recordId)).thenReturn(testRecord);
        when(fileUploadService.getUpload(testRecord.getUploadId())).thenReturn(testUpload);
        when(recordMapper.toResponseDTO(testRecord, testUpload)).thenReturn(testResponseDTO);
        when(fileUploadService.getFileUrl(testUpload)).thenReturn(expectedUrl);

        // when
        RecordResponseDTO result = recordService.getRecord(recordId);

        // then
        assertNotNull(result);
        assertEquals(expectedUrl, result.getUrl());
        assertEquals("SUCCESS", result.getUrlStatus());

        verify(recordRepository).findByIdWithUpload(recordId);
        verify(fileUploadService).getUpload(testRecord.getUploadId());
        verify(recordMapper).toResponseDTO(testRecord, testUpload);
        verify(fileUploadService).getFileUrl(testUpload);
    }
}