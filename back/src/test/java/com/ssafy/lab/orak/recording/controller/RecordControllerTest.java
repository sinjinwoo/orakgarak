package com.ssafy.lab.orak.recording.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.exception.RecordPermissionDeniedException;
import com.ssafy.lab.orak.recording.service.RecordService;
import com.ssafy.lab.orak.upload.exception.FileUploadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.ssafy.lab.orak.common.exception.CustomRestAdvice;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecordController 단위 테스트")
class RecordControllerTest {

    // Custom argument resolver for @AuthenticationPrincipal
    private static class TestAuthenticationPrincipalArgumentResolver implements HandlerMethodArgumentResolver {
        private final CustomUserPrincipal principal;

        public TestAuthenticationPrincipalArgumentResolver(CustomUserPrincipal principal) {
            this.principal = principal;
        }

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class) &&
                   parameter.getParameterType().equals(CustomUserPrincipal.class);
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            return principal;
        }
    }

    private MockMvc mockMvc;

    @Mock
    private RecordService recordService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private RecordController recordController;

    private ObjectMapper objectMapper;
    private RecordResponseDTO testResponseDTO;
    private MockMultipartFile testAudioFile;
    private User testUser;
    private CustomUserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        // 테스트 사용자 설정 (먼저 설정해야 함)
        testUser = User.builder()
            .id(1L)
            .email("test@test.com")
            .nickname("testuser")
            .googleID("google123")
            .build();
        
        testPrincipal = new CustomUserPrincipal(testUser);
        
        mockMvc = MockMvcBuilders.standaloneSetup(recordController)
                .setControllerAdvice(new CustomRestAdvice())
                .setCustomArgumentResolvers(new TestAuthenticationPrincipalArgumentResolver(testPrincipal))
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

        testAudioFile = new MockMultipartFile(
            "audioFile",
            "test-recording.mp3",
            "audio/mpeg",
            "test audio content".getBytes()
        );
    }

    private void setupAuthentication(Long userId) {
        User user = User.builder()
            .id(userId)
            .email("test@test.com")
            .nickname("testuser")
            .googleID("google123")
            .build();
        CustomUserPrincipal principal = new CustomUserPrincipal(user);
        
        when(authentication.getPrincipal()).thenReturn(principal);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("녹음 생성 성공 테스트")
    void createRecord_Success() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyLong()))
            .thenReturn(testResponseDTO);

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA))
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
    void createRecord_MissingRequiredParams_BadRequest() throws Exception {
        // when & then - title 없음
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isBadRequest());

        verify(recordService, never()).createRecord(any(), any(), any(), any());
    }

    @Test
    @DisplayName("파일 업로드 실패 시 예외 전파")
    void createRecord_FileUploadFails_ThrowsException() throws Exception {
        // given
        when(recordService.createRecord(anyString(), anyLong(), any(MultipartFile.class), anyLong()))
            .thenThrow(new FileUploadException("파일 업로드 실패"));

        // when & then
        mockMvc.perform(multipart("/api/records")
                .file(testAudioFile)
                .param("title", "테스트 녹음")
                .param("songId", "100")
                .contentType(MediaType.MULTIPART_FORM_DATA))
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
    void getMyRecords_Success() throws Exception {
        // given
        List<RecordResponseDTO> records = Arrays.asList(testResponseDTO);
        when(recordService.getRecordsByUser(1L)).thenReturn(records);

        // when & then
        mockMvc.perform(get("/api/records/me"))
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
    void updateRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 녹음 제목";
        RecordResponseDTO updatedResponse = testResponseDTO.toBuilder().title(newTitle).build();
        
        when(recordService.updateRecord(recordId, newTitle, 1L)).thenReturn(updatedResponse);

        // when & then
        mockMvc.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(newTitle))
            .andExpect(jsonPath("$.id").value(recordId));

        verify(recordService).updateRecord(recordId, newTitle, 1L);
    }

    @Test
    @DisplayName("권한 없는 녹음 수정 시 403")
    void updateRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        String newTitle = "수정된 제목";
        User user2 = User.builder().id(2L).email("test2@test.com").nickname("testuser2").googleID("google456").build();
        CustomUserPrincipal principal2 = new CustomUserPrincipal(user2);
        
        // Create a new MockMvc with the different user
        MockMvc mockMvcWithUser2 = MockMvcBuilders.standaloneSetup(recordController)
                .setControllerAdvice(new CustomRestAdvice())
                .setCustomArgumentResolvers(new TestAuthenticationPrincipalArgumentResolver(principal2))
                .build();
        
        when(recordService.updateRecord(recordId, newTitle, 2L))
            .thenThrow(new RecordPermissionDeniedException(recordId, 2L));

        // when & then
        mockMvcWithUser2.perform(put("/api/records/{recordId}", recordId)
                .param("title", newTitle))
            .andExpect(status().isForbidden());

        verify(recordService).updateRecord(recordId, newTitle, 2L);
    }

    @Test
    @DisplayName("녹음 삭제 성공 테스트")
    void deleteRecord_Success() throws Exception {
        // given
        Long recordId = 1L;
        
        doNothing().when(recordService).deleteRecord(recordId, 1L);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId))
            .andExpect(status().isNoContent());

        verify(recordService).deleteRecord(recordId, 1L);
    }

    @Test
    @DisplayName("존재하지 않는 녹음 삭제 시 404")
    void deleteRecord_NotFound_Returns404() throws Exception {
        // given
        Long recordId = 999L;
        
        doThrow(new RecordNotFoundException(recordId))
            .when(recordService).deleteRecord(recordId, 1L);

        // when & then
        mockMvc.perform(delete("/api/records/{recordId}", recordId))
            .andExpect(status().isNotFound());

        verify(recordService).deleteRecord(recordId, 1L);
    }

    @Test
    @DisplayName("권한 없는 녹음 삭제 시 403")
    void deleteRecord_PermissionDenied_Returns403() throws Exception {
        // given
        Long recordId = 1L;
        User user2 = User.builder().id(2L).email("test2@test.com").nickname("testuser2").googleID("google456").build();
        CustomUserPrincipal principal2 = new CustomUserPrincipal(user2);
        
        // Create a new MockMvc with the different user
        MockMvc mockMvcWithUser2 = MockMvcBuilders.standaloneSetup(recordController)
                .setControllerAdvice(new CustomRestAdvice())
                .setCustomArgumentResolvers(new TestAuthenticationPrincipalArgumentResolver(principal2))
                .build();
        
        doThrow(new RecordPermissionDeniedException(recordId, 2L))
            .when(recordService).deleteRecord(recordId, 2L);

        // when & then
        mockMvcWithUser2.perform(delete("/api/records/{recordId}", recordId))
            .andExpect(status().isForbidden());

        verify(recordService).deleteRecord(recordId, 2L);
    }
}