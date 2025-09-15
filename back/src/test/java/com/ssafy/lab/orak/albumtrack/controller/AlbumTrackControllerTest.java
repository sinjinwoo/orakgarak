package com.ssafy.lab.orak.albumtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.albumtrack.dto.request.AddTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.BulkAddTracksRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.ReorderTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTrackResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTracksResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.PlaybackResponseDTO;
import com.ssafy.lab.orak.albumtrack.exception.AlbumTrackException;
import com.ssafy.lab.orak.albumtrack.service.AlbumTrackService;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.common.exception.CustomRestAdvice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlbumTrackController 테스트")
class AlbumTrackControllerTest {

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
    private AlbumTrackService albumTrackService;

    @InjectMocks
    private AlbumTrackController albumTrackController;

    private ObjectMapper objectMapper;
    private CustomUserPrincipal testUserPrincipal;
    private AlbumTrackResponseDTO testTrackResponse;
    private AlbumTracksResponseDTO testTracksResponse;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        User testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .nickname("testUser")
                .build();
        
        testUserPrincipal = new CustomUserPrincipal(testUser);
        
        mockMvc = MockMvcBuilders
                .standaloneSetup(albumTrackController)
                .setCustomArgumentResolvers(new TestAuthenticationPrincipalArgumentResolver(testUserPrincipal))
                .setControllerAdvice(new CustomRestAdvice())
                .build();

        testTrackResponse = AlbumTrackResponseDTO.builder()
                .id(1L)
                .albumId(1L)
                .recordId(1L)
                .recordTitle("테스트 녹음")
                .trackOrder(1)
                .durationSeconds(120)
                .audioUrl("http://test-url.com/audio.mp3")
                .build();

        testTracksResponse = AlbumTracksResponseDTO.builder()
                .albumId(1L)
                .albumTitle("테스트 앨범")
                .totalTracks(1)
                .totalDuration(120)
                .tracks(Arrays.asList(testTrackResponse))
                .build();
    }

    @Test
    @DisplayName("앨범 트랙 목록 조회 성공")
    void getAlbumTracks_Success() throws Exception {
        // Given
        Long albumId = 1L;
        when(albumTrackService.getAlbumTracks(eq(albumId), anyLong())).thenReturn(testTracksResponse);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks", albumId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.albumId").value(1L))
                .andExpect(jsonPath("$.albumTitle").value("테스트 앨범"))
                .andExpect(jsonPath("$.totalTracks").value(1))
                .andExpect(jsonPath("$.tracks[0].recordTitle").value("테스트 녹음"));
    }

    @Test
    @DisplayName("특정 트랙 조회 성공")
    void getTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        when(albumTrackService.getTrack(eq(albumId), eq(trackOrder), anyLong())).thenReturn(testTrackResponse);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks/{trackOrder}", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.recordTitle").value("테스트 녹음"))
                .andExpect(jsonPath("$.trackOrder").value(1));
    }

    @Test
    @DisplayName("트랙 추가 성공")
    void addTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        AddTrackRequestDTO request = AddTrackRequestDTO.builder()
                .recordId(1L)
                .trackOrder(1)
                .build();

        when(albumTrackService.addTrack(eq(albumId), any(AddTrackRequestDTO.class), anyLong()))
                .thenReturn(testTrackResponse);

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.recordId").value(1L))
                .andExpect(jsonPath("$.trackOrder").value(1));
    }

    @Test
    @DisplayName("트랙 추가 시 유효성 검사 실패")
    void addTrack_ValidationFailed() throws Exception {
        // Given
        Long albumId = 1L;
        AddTrackRequestDTO invalidRequest = AddTrackRequestDTO.builder()
                .recordId(null) // 필수 필드 누락
                .trackOrder(0) // 최소값 위반
                .build();

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("여러 트랙 일괄 추가 성공")
    void addTracks_Success() throws Exception {
        // Given
        Long albumId = 1L;
        List<AddTrackRequestDTO> tracks = Arrays.asList(
                AddTrackRequestDTO.builder().recordId(1L).trackOrder(1).build(),
                AddTrackRequestDTO.builder().recordId(2L).trackOrder(2).build()
        );
        
        BulkAddTracksRequestDTO request = BulkAddTracksRequestDTO.builder()
                .tracks(tracks)
                .build();

        List<AlbumTrackResponseDTO> responses = Arrays.asList(testTrackResponse);
        when(albumTrackService.addTracks(eq(albumId), any(BulkAddTracksRequestDTO.class), anyLong()))
                .thenReturn(responses);

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks/bulk", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].recordId").value(1L));
    }

    @Test
    @DisplayName("트랙 삭제 성공")
    void removeTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        doNothing().when(albumTrackService).removeTrack(eq(albumId), eq(trackOrder), anyLong());

        // When & Then
        mockMvc.perform(delete("/api/albums/{albumId}/tracks/{trackOrder}", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("트랙 순서 변경 성공")
    void reorderTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        ReorderTrackRequestDTO request = ReorderTrackRequestDTO.builder()
                .fromOrder(1)
                .toOrder(2)
                .build();

        when(albumTrackService.reorderTrack(eq(albumId), any(ReorderTrackRequestDTO.class), anyLong()))
                .thenReturn(testTracksResponse);

        // When & Then
        mockMvc.perform(put("/api/albums/{albumId}/tracks/reorder", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.albumId").value(1L));
    }

    @Test
    @DisplayName("다음 트랙 조회 성공")
    void getNextTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        when(albumTrackService.getNextTrack(eq(albumId), eq(trackOrder), anyLong()))
                .thenReturn(testTrackResponse);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks/{trackOrder}/next", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.trackOrder").value(1));
    }

    @Test
    @DisplayName("다음 트랙이 없을 때 204 반환")
    void getNextTrack_NoContent() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        when(albumTrackService.getNextTrack(eq(albumId), eq(trackOrder), anyLong()))
                .thenReturn(null);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks/{trackOrder}/next", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("이전 트랙 조회 성공")
    void getPreviousTrack_Success() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 2;
        when(albumTrackService.getPreviousTrack(eq(albumId), eq(trackOrder), anyLong()))
                .thenReturn(testTrackResponse);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks/{trackOrder}/previous", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.trackOrder").value(1));
    }

    @Test
    @DisplayName("이전 트랙이 없을 때 204 반환")
    void getPreviousTrack_NoContent() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        when(albumTrackService.getPreviousTrack(eq(albumId), eq(trackOrder), anyLong()))
                .thenReturn(null);

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks/{trackOrder}/previous", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("앨범 재생 시작 성공")
    void startAlbumPlayback_Success() throws Exception {
        // Given
        Long albumId = 1L;
        
        AlbumTrackResponseDTO nextTrack = AlbumTrackResponseDTO.builder()
                .id(2L)
                .trackOrder(2)
                .build();
        
        PlaybackResponseDTO playbackResponse = PlaybackResponseDTO.builder()
                .currentTrack(testTrackResponse)
                .nextTrack(nextTrack)
                .previousTrack(null)
                .hasNext(true)
                .hasPrevious(false)
                .totalTracks(2)
                .build();

        when(albumTrackService.getTrack(eq(albumId), eq(1), anyLong())).thenReturn(testTrackResponse);
        when(albumTrackService.getNextTrack(eq(albumId), eq(1), anyLong())).thenReturn(nextTrack);
        when(albumTrackService.getAlbumTracks(eq(albumId), anyLong())).thenReturn(testTracksResponse);

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks/play", albumId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.currentTrack.trackOrder").value(1))
                .andExpect(jsonPath("$.hasNext").value(true))
                .andExpect(jsonPath("$.hasPrevious").value(false));
    }

    @Test
    @DisplayName("특정 트랙부터 재생 성공")
    void startTrackPlayback_Success() throws Exception {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 2;
        
        AlbumTrackResponseDTO currentTrack = AlbumTrackResponseDTO.builder()
                .id(2L)
                .trackOrder(2)
                .build();
        
        when(albumTrackService.getTrack(eq(albumId), eq(trackOrder), anyLong())).thenReturn(currentTrack);
        when(albumTrackService.getNextTrack(eq(albumId), eq(trackOrder), anyLong())).thenReturn(null);
        when(albumTrackService.getPreviousTrack(eq(albumId), eq(trackOrder), anyLong())).thenReturn(testTrackResponse);
        when(albumTrackService.getAlbumTracks(eq(albumId), anyLong())).thenReturn(testTracksResponse);

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks/{trackOrder}/play", albumId, trackOrder))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.currentTrack.trackOrder").value(2))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.hasPrevious").value(true));
    }

    @Test
    @DisplayName("셔플 재생 목록 조회 성공")
    void getShuffledPlaylist_Success() throws Exception {
        // Given
        Long albumId = 1L;
        when(albumTrackService.getAlbumTracks(eq(albumId), anyLong())).thenReturn(testTracksResponse);

        // When & Then
        mockMvc.perform(post("/api/albums/{albumId}/tracks/shuffle", albumId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.albumId").value(1L))
                .andExpect(jsonPath("$.tracks[0].recordTitle").value("테스트 녹음"));
    }

    @Test
    @DisplayName("서비스에서 예외 발생 시 적절한 에러 응답")
    void serviceException_ReturnsAppropriateError() throws Exception {
        // Given
        Long albumId = 999L;
        when(albumTrackService.getAlbumTracks(eq(albumId), anyLong()))
                .thenThrow(new AlbumTrackException("앨범에 접근할 권한이 없습니다"));

        // When & Then
        mockMvc.perform(get("/api/albums/{albumId}/tracks", albumId))
                .andDo(print())
                .andExpect(status().isInternalServerError());
    }
}