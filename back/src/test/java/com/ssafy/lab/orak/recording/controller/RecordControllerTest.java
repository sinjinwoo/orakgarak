package com.ssafy.lab.orak.recording.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
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
    @WithMockUser(username = "1")
    void createRecord_Success() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyLong()))
            .thenReturn(testResponseDTO);

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.title").value("테스트 녹음"))
            .andExpect(jsonPath("$.userId").value(1L))
            .andExpect(jsonPath("$.songId").value(100L))
            .andExpect(jsonPath("$.durationSeconds").value(180))
            .andExpect(jsonPath("$.uploadId").value(1L));

        verify(recordService).createRecord(eq("테스트 녹음"), eq(100L), any(MultipartFile.class), eq(1L));
    }

    @Test
    @DisplayName("필수 파라미터 없이 녹음 생성 시 실패")
    @WithMockUser(username = "1")
    void createRecord_MissingRequiredParams_BadRequest() throws Exception {
        // when & then - title 없음
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .with(csrf()))
            .andExpect(status().isBadRequest());

        verify(recordService, never()).createRecord(any(), any(), any(), any());
    }

    @Test
    @DisplayName("파일 업로드 실패 시 예외 전파")
    @WithMockUser(username = "1")
    void createRecord_FileUploadFails_ThrowsException() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyLong()))
            .thenThrow(new FileUploadException("파일 업로드 실패"));

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .with(csrf()))
            .andExpect(status().isBadRequest());

        verify(recordService).createRecord(eq("테스트 녹음"), eq(100L), any(MultipartFile.class), eq(1L));
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
            .andExpect(status().isNotFound());

        verify(recordService).getRecord(recordId);
    }

    @Test
    @DisplayName("내 녹음 목록 조회 성공 테스트")
    @WithMockUser(username = "1")
    void getMyRecords_Success() throws Exception {
        // given
        List<RecordResponseDTO> records = Arrays.asList(testResponseDTO);
        when(recordService.getRecordsByUser(1L)).thenReturn(records);

        // when & then
        mockMvc.perform(get("/api/records/me")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].userId").value(1L))
            .andExpect(jsonPath("$.length()").value(1));

        verify(recordService).getRecordsByUser(1L);
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
    @WithMockUser(username = "1")
    void updateRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 녹음 제목";
        RecordResponseDTO updatedResponse = testResponseDTO.toBuilder().title(newTitle).build();
        
        when(recordService.updateRecord(recordId, newTitle, 1L)).thenReturn(updatedResponse);

        // when & then
        mockMvc.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(newTitle))
            .andExpect(jsonPath("$.id").value(recordId));

        verify(recordService).updateRecord(recordId, newTitle, 1L);
    }

    @Test
    @DisplayName("권한 없는 녹음 수정 시 403")
    @WithMockUser(username = "2")
    void updateRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 제목";
        
        when(recordService.updateRecord(recordId, newTitle, 2L))
            .thenThrow(new RecordPermissionDeniedException(recordId, 2L));

        // when & then
        mockMvc.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle)
                .with(csrf()))
            .andExpect(status().isForbidden());

        verify(recordService).updateRecord(recordId, newTitle, 2L);
    }

    @Test
    @DisplayName("녹음 삭제 성공 테스트")
    @WithMockUser(username = "1")
    void deleteRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        
        doNothing().when(recordService).deleteRecord(recordId, 1L);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(recordService).deleteRecord(recordId, 1L);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 삭제 시 404")
    @WithMockUser(username = "1")
    void deleteRecord_NotFound_Returns404() throws Exception {
        // given
        Long recordId = 999L;
        
        doThrow(new RecordNotFoundException(recordId))
            .when(recordService).deleteRecord(recordId, 1L);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(recordService).deleteRecord(recordId, 1L);
    }

    @Test
    @DisplayName("권한 없는 녹음 삭제 시 403")
    @WithMockUser(username = "2")
    void deleteRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        
        doThrow(new RecordPermissionDeniedException(recordId, 2L))
            .when(recordService).deleteRecord(recordId, 2L);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId)
                .with(csrf()))
            .andExpect(status().isForbidden());

        verify(recordService).deleteRecord(recordId, 2L);
    }
}