package com.ssafy.lab.orak.profile.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.common.exception.CustomRestAdvice;
import com.ssafy.lab.orak.profile.dto.LikedAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileStatsResponseDTO;
import com.ssafy.lab.orak.profile.dto.UserAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.service.ProfileService;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileController 마이페이지 기능 테스트")
class ProfileControllerTest {

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
    private ProfileService profileService;

    @InjectMocks
    private ProfileController profileController;

    private ObjectMapper objectMapper;
    private CustomUserPrincipal testUserPrincipal;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        User testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .build();

        testUserPrincipal = new CustomUserPrincipal(testUser);

        mockMvc = MockMvcBuilders
                .standaloneSetup(profileController)
                .setCustomArgumentResolvers(
                        new TestAuthenticationPrincipalArgumentResolver(testUserPrincipal),
                        new PageableHandlerMethodArgumentResolver()
                )
                .setControllerAdvice(new CustomRestAdvice())
                .build();
    }

    @Test
    @DisplayName("마이페이지 활동 통계 조회 성공")
    void getMyPageStats_Success() throws Exception {
        // Given
        ProfileStatsResponseDTO statsResponse = ProfileStatsResponseDTO.of(
                100L, // followerCount
                50L,  // followingCount
                20L,  // albumCount
                15L   // likedAlbumCount
        );

        when(profileService.getMyPageStats(1L)).thenReturn(statsResponse);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/stats"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.followerCount").value(100))
                .andExpect(jsonPath("$.followingCount").value(50))
                .andExpect(jsonPath("$.albumCount").value(20))
                .andExpect(jsonPath("$.likedAlbumCount").value(15));
    }

    @Test
    @DisplayName("좋아요한 앨범 목록 조회 성공")
    void getLikedAlbums_Success() throws Exception {
        // Given
        AlbumResponseDto album1 = AlbumResponseDto.builder()
                .id(1L)
                .userId(2L)
                .title("좋아요한 앨범 1")
                .description("설명 1")
                .isPublic(true)
                .trackCount(5)
                .totalDuration(300)
                .likeCount(10)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AlbumResponseDto album2 = AlbumResponseDto.builder()
                .id(2L)
                .userId(3L)
                .title("좋아요한 앨범 2")
                .description("설명 2")
                .isPublic(true)
                .trackCount(3)
                .totalDuration(180)
                .likeCount(5)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<AlbumResponseDto> albums = Arrays.asList(album1, album2);

        LikedAlbumsResponseDTO response = LikedAlbumsResponseDTO.builder()
                .likedAlbums(albums)
                .currentPage(0)
                .totalPages(1)
                .totalElements(2L)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(profileService.getLikedAlbums(eq(1L), any(Pageable.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/liked-albums")
                        .param("page", "0")
                        .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.likedAlbums").isArray())
                .andExpect(jsonPath("$.likedAlbums[0].title").value("좋아요한 앨범 1"))
                .andExpect(jsonPath("$.likedAlbums[1].title").value("좋아요한 앨범 2"))
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    @DisplayName("내 앨범 목록 조회 성공")
    void getMyAlbums_Success() throws Exception {
        // Given
        AlbumResponseDto myAlbum1 = AlbumResponseDto.builder()
                .id(10L)
                .userId(1L)
                .title("내 앨범 1")
                .description("내가 만든 앨범 1")
                .isPublic(true)
                .trackCount(8)
                .totalDuration(480)
                .likeCount(25)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AlbumResponseDto myAlbum2 = AlbumResponseDto.builder()
                .id(11L)
                .userId(1L)
                .title("내 앨범 2")
                .description("내가 만든 앨범 2")
                .isPublic(false)
                .trackCount(4)
                .totalDuration(240)
                .likeCount(12)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<AlbumResponseDto> myAlbums = Arrays.asList(myAlbum1, myAlbum2);

        UserAlbumsResponseDTO response = UserAlbumsResponseDTO.builder()
                .albums(myAlbums)
                .currentPage(0)
                .totalPages(1)
                .totalElements(2L)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(profileService.getMyAlbums(eq(1L), any(Pageable.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/albums")
                        .param("page", "0")
                        .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.albums").isArray())
                .andExpect(jsonPath("$.albums[0].title").value("내 앨범 1"))
                .andExpect(jsonPath("$.albums[0].userId").value(1))
                .andExpect(jsonPath("$.albums[1].title").value("내 앨범 2"))
                .andExpect(jsonPath("$.albums[1].isPublic").value(false))
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("좋아요한 앨범 목록 조회 - 빈 결과")
    void getLikedAlbums_EmptyResult() throws Exception {
        // Given
        LikedAlbumsResponseDTO emptyResponse = LikedAlbumsResponseDTO.builder()
                .likedAlbums(Arrays.asList())
                .currentPage(0)
                .totalPages(0)
                .totalElements(0L)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(profileService.getLikedAlbums(eq(1L), any(Pageable.class))).thenReturn(emptyResponse);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/liked-albums"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.likedAlbums").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("내 앨범 목록 조회 - 빈 결과")
    void getMyAlbums_EmptyResult() throws Exception {
        // Given
        UserAlbumsResponseDTO emptyResponse = UserAlbumsResponseDTO.builder()
                .albums(Arrays.asList())
                .currentPage(0)
                .totalPages(0)
                .totalElements(0L)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(profileService.getMyAlbums(eq(1L), any(Pageable.class))).thenReturn(emptyResponse);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/albums"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.albums").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("마이페이지 통계 조회 - 모든 카운트가 0인 경우")
    void getMyPageStats_AllZeroCounts() throws Exception {
        // Given
        ProfileStatsResponseDTO zeroStatsResponse = ProfileStatsResponseDTO.of(0L, 0L, 0L, 0L);

        when(profileService.getMyPageStats(1L)).thenReturn(zeroStatsResponse);

        // When & Then
        mockMvc.perform(get("/profiles/mypage/stats"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.followerCount").value(0))
                .andExpect(jsonPath("$.followingCount").value(0))
                .andExpect(jsonPath("$.albumCount").value(0))
                .andExpect(jsonPath("$.likedAlbumCount").value(0));
    }
}