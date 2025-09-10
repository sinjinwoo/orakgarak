package com.ssafy.lab.orak.recording.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.service.RecordService;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(RecordController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("RecordController 단위 테스트")
class RecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecordService recordService;

    @Autowired
    private ObjectMapper objectMapper;

    private RecordResponseDTO testResponseDTO;
    private MockMultipartFile testAudioFile;

    @BeforeEach
    void setUp() {
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

        testAudioFile = new MockMultipartFile(
            "audioFile",
            "test-recording.mp3",
            "audio/mpeg",
            "test audio content".getBytes()
        );
    }

    @Test
    @DisplayName("녹음 생성 성공 테스트")
    void createRecord_Success() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyInt(), anyLong()))
            .thenReturn(testResponseDTO);

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .param("durationSeconds", "180")
                .header("userId", "1")
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.title").value("테스트 녹음"))
            .andExpect(jsonPath("$.userId").value(1L))
            .andExpect(jsonPath("$.songId").value(100L))
            .andExpect(jsonPath("$.durationSeconds").value(180))
            .andExpect(jsonPath("$.uploadId").value(1L));

        verify(recordService).createRecord(eq("테스트 녹음"), eq(100L), any(MultipartFile.class), eq(180), eq(1L));
    }

    @Test
    @DisplayName("필수 파라미터 없이 녹음 생성 시 실패")
    void createRecord_MissingRequiredParams_BadRequest() throws Exception {
        // when & then - title 없음
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("songId", "100")
                .param("durationSeconds", "180")
                .header("userId", "1")
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isBadRequest());

        verify(recordService, never()).createRecord(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("파일 업로드 실패 시 예외 전파")
    void createRecord_FileUploadFails_ThrowsException() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyInt(), anyLong()))
            .thenThrow(new FileUploadException("파일 업로드 실패"));

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .param("durationSeconds", "180")
                .header("userId", "1")
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("FILE_UPLOAD_ERROR"));

        verify(recordService).createRecord(eq("테스트 녹음"), eq(100L), any(MultipartFile.class), eq(180), eq(1L));
    }

    @Test
    @DisplayName("녹음 조회 성공 테스트")
    void getRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        when(recordService.getRecord(recordId)).thenReturn(testResponseDTO);

        // when & then
        mockMvc.perform(get("/api/records/{recordId}", recordId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.title").value("테스트 녹음"))
            .andExpect(jsonPath("$.userId").value(1L));

        verify(recordService).getRecord(recordId);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 조회 시 404")
    void getRecord_NotFound_Returns404() throws Exception {
        // given
        Long recordId = 999L;
        when(recordService.getRecord(recordId)).thenThrow(new RecordNotFoundException(recordId));

        // when & then
        mockMvc.perform(get("/api/records/{recordId}", recordId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errorCode").value("RECORD_NOT_FOUND"));

        verify(recordService).getRecord(recordId);
    }

    @Test
    @DisplayName("사용자별 녹음 목록 조회 성공 테스트")
    void getRecordsByUser_Success() throws Exception {
        // given
        Long userId = 1L;
        List<RecordResponseDTO> records = Arrays.asList(testResponseDTO);
        when(recordService.getRecordsByUser(userId)).thenReturn(records);

        // when & then
        mockMvc.perform(get("/api/records/user/{userId}", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].userId").value(1L))
            .andExpect(jsonPath("$.length()").value(1));

        verify(recordService).getRecordsByUser(userId);
    }

    @Test
    @DisplayName("곡별 녹음 목록 조회 성공 테스트")
    void getRecordsBySong_Success() throws Exception {
        // given
        Long songId = 100L;
        List<RecordResponseDTO> records = Arrays.asList(testResponseDTO);
        when(recordService.getRecordsBySong(songId)).thenReturn(records);

        // when & then
        mockMvc.perform(get("/api/records/song/{songId}", songId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].songId").value(100L))
            .andExpect(jsonPath("$.length()").value(1));

        verify(recordService).getRecordsBySong(songId);
    }

    @Test
    @DisplayName("녹음 수정 성공 테스트")
    void updateRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        Long userId = 1L;
        String newTitle = "수정된 녹음 제목";
        RecordResponseDTO updatedResponse = testResponseDTO.toBuilder().title(newTitle).build();
        
        when(recordService.updateRecord(recordId, newTitle, userId)).thenReturn(updatedResponse);

        // when & then
        mockMvc.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle)
                .header("userId", userId.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(newTitle))
            .andExpect(jsonPath("$.id").value(recordId));

        verify(recordService).updateRecord(recordId, newTitle, userId);
    }

    @Test
    @DisplayName("권한 없는 녹음 수정 시 403")
    void updateRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        Long userId = 2L; // 다른 사용자
        String newTitle = "수정된 제목";
        
        when(recordService.updateRecord(recordId, newTitle, userId))
            .thenThrow(new RecordPermissionDeniedException(recordId, userId));

        // when & then
        mockMvc.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle)
                .header("userId", userId.toString()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("RECORD_PERMISSION_DENIED"));

        verify(recordService).updateRecord(recordId, newTitle, userId);
    }

    @Test
    @DisplayName("녹음 삭제 성공 테스트")
    void deleteRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        Long userId = 1L;
        
        doNothing().when(recordService).deleteRecord(recordId, userId);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .header("userId", userId.toString()))
            .andExpect(status().isNoContent());

        verify(recordService).deleteRecord(recordId, userId);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 삭제 시 404")
    void deleteRecord_NotFound_Returns404() throws Exception {
        // given
        Long recordId = 999L;
        Long userId = 1L;
        
        doThrow(new RecordNotFoundException(recordId))
            .when(recordService).deleteRecord(recordId, userId);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .header("userId", userId.toString()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errorCode").value("RECORD_NOT_FOUND"));

        verify(recordService).deleteRecord(recordId, userId);
    }

    @Test
    @DisplayName("권한 없는 녹음 삭제 시 403")
    void deleteRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        Long userId = 2L; // 다른 사용자
        
        doThrow(new RecordPermissionDeniedException(recordId, userId))
            .when(recordService).deleteRecord(recordId, userId);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .header("userId", userId.toString()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("RECORD_PERMISSION_DENIED"));

        verify(recordService).deleteRecord(recordId, userId);
    }
}