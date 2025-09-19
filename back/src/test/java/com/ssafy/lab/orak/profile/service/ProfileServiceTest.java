package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.follow.repository.FollowRepository;
import com.ssafy.lab.orak.like.repository.LikeRepository;
import com.ssafy.lab.orak.profile.dto.LikedAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileStatsResponseDTO;
import com.ssafy.lab.orak.profile.dto.UserAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.exception.ProfileNotFoundException;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileService 마이페이지 기능 테스트")
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private LikeRepository likeRepository;

    @InjectMocks
    private ProfileServiceImpl profileService;

    private Profile testProfile;
    private User testUser;
    private Album testAlbum1;
    private Album testAlbum2;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .build();

        testProfile = Profile.builder()
                .id(1L)
                .user(testUser)
                .nickname("테스트닉네임")
                .description("테스트 설명")
                .build();

        testAlbum1 = Album.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 앨범 1")
                .description("앨범 설명 1")
                .isPublic(true)
                .trackCount(5)
                .totalDuration(300)
                .likeCount(10)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testAlbum2 = Album.builder()
                .id(2L)
                .userId(2L)
                .title("테스트 앨범 2")
                .description("앨범 설명 2")
                .isPublic(true)
                .trackCount(3)
                .totalDuration(180)
                .likeCount(5)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("마이페이지 통계 조회 성공")
    void getMyPageStats_Success() {
        // Given
        Long userId = 1L;
        when(profileRepository.findByUser_Id(userId)).thenReturn(Optional.of(testProfile));
        when(followRepository.countByFollowing(testProfile)).thenReturn(100L);
        when(followRepository.countByFollower(testProfile)).thenReturn(50L);
        when(albumRepository.countByUserId(userId)).thenReturn(20L);
        when(likeRepository.countByUserId(userId)).thenReturn(15L);

        // When
        ProfileStatsResponseDTO result = profileService.getMyPageStats(userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFollowerCount()).isEqualTo(100L);
        assertThat(result.getFollowingCount()).isEqualTo(50L);
        assertThat(result.getAlbumCount()).isEqualTo(20L);
        assertThat(result.getLikedAlbumCount()).isEqualTo(15L);
    }

    @Test
    @DisplayName("마이페이지 통계 조회 - 프로필이 없을 때 예외 발생")
    void getMyPageStats_ProfileNotFound() {
        // Given
        Long userId = 999L;
        when(profileRepository.findByUser_Id(userId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> profileService.getMyPageStats(userId))
                .isInstanceOf(ProfileNotFoundException.class)
                .hasMessageContaining("프로필을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("마이페이지 통계 조회 - 모든 카운트가 0")
    void getMyPageStats_AllZeroCounts() {
        // Given
        Long userId = 1L;
        when(profileRepository.findByUser_Id(userId)).thenReturn(Optional.of(testProfile));
        when(followRepository.countByFollowing(testProfile)).thenReturn(0L);
        when(followRepository.countByFollower(testProfile)).thenReturn(0L);
        when(albumRepository.countByUserId(userId)).thenReturn(0L);
        when(likeRepository.countByUserId(userId)).thenReturn(0L);

        // When
        ProfileStatsResponseDTO result = profileService.getMyPageStats(userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFollowerCount()).isEqualTo(0L);
        assertThat(result.getFollowingCount()).isEqualTo(0L);
        assertThat(result.getAlbumCount()).isEqualTo(0L);
        assertThat(result.getLikedAlbumCount()).isEqualTo(0L);
    }

    @Test
    @DisplayName("좋아요한 앨범 목록 조회 성공")
    void getLikedAlbums_Success() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        List<Album> albums = Arrays.asList(testAlbum1, testAlbum2);
        Page<Album> albumPage = new PageImpl<>(albums, pageable, 2);

        when(likeRepository.findLikedAlbumsByUserId(userId, pageable)).thenReturn(albumPage);

        // When
        LikedAlbumsResponseDTO result = profileService.getLikedAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getLikedAlbums()).hasSize(2);
        assertThat(result.getLikedAlbums().get(0).getTitle()).isEqualTo("테스트 앨범 1");
        assertThat(result.getLikedAlbums().get(1).getTitle()).isEqualTo("테스트 앨범 2");
        assertThat(result.getCurrentPage()).isEqualTo(0);
        assertThat(result.getTotalElements()).isEqualTo(2L);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.isHasNext()).isFalse();
        assertThat(result.isHasPrevious()).isFalse();
    }

    @Test
    @DisplayName("좋아요한 앨범 목록 조회 - 빈 결과")
    void getLikedAlbums_EmptyResult() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        Page<Album> emptyPage = new PageImpl<>(Arrays.asList(), pageable, 0);

        when(likeRepository.findLikedAlbumsByUserId(userId, pageable)).thenReturn(emptyPage);

        // When
        LikedAlbumsResponseDTO result = profileService.getLikedAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getLikedAlbums()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0L);
        assertThat(result.getTotalPages()).isEqualTo(0);
    }

    @Test
    @DisplayName("좋아요한 앨범 목록 조회 - 페이징")
    void getLikedAlbums_WithPaging() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(1, 1); // 두 번째 페이지, 1개씩
        List<Album> albums = Arrays.asList(testAlbum2);
        Page<Album> albumPage = new PageImpl<>(albums, pageable, 2);

        when(likeRepository.findLikedAlbumsByUserId(userId, pageable)).thenReturn(albumPage);

        // When
        LikedAlbumsResponseDTO result = profileService.getLikedAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getLikedAlbums()).hasSize(1);
        assertThat(result.getCurrentPage()).isEqualTo(1);
        assertThat(result.getTotalElements()).isEqualTo(2L);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.isHasNext()).isFalse();
        assertThat(result.isHasPrevious()).isTrue();
    }

    @Test
    @DisplayName("내 앨범 목록 조회 성공")
    void getMyAlbums_Success() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        List<Album> myAlbums = Arrays.asList(testAlbum1);
        Page<Album> albumPage = new PageImpl<>(myAlbums, pageable, 1);

        when(albumRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)).thenReturn(albumPage);

        // When
        UserAlbumsResponseDTO result = profileService.getMyAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAlbums()).hasSize(1);
        assertThat(result.getAlbums().get(0).getTitle()).isEqualTo("테스트 앨범 1");
        assertThat(result.getAlbums().get(0).getUserId()).isEqualTo(1L);
        assertThat(result.getCurrentPage()).isEqualTo(0);
        assertThat(result.getTotalElements()).isEqualTo(1L);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.isHasNext()).isFalse();
        assertThat(result.isHasPrevious()).isFalse();
    }

    @Test
    @DisplayName("내 앨범 목록 조회 - 빈 결과")
    void getMyAlbums_EmptyResult() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        Page<Album> emptyPage = new PageImpl<>(Arrays.asList(), pageable, 0);

        when(albumRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)).thenReturn(emptyPage);

        // When
        UserAlbumsResponseDTO result = profileService.getMyAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAlbums()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0L);
        assertThat(result.getTotalPages()).isEqualTo(0);
    }

    @Test
    @DisplayName("내 앨범 목록 조회 - 다중 페이지")
    void getMyAlbums_MultiplePages() {
        // Given
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 1); // 첫 번째 페이지, 1개씩
        List<Album> firstPageAlbums = Arrays.asList(testAlbum1);
        Page<Album> albumPage = new PageImpl<>(firstPageAlbums, pageable, 2);

        when(albumRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)).thenReturn(albumPage);

        // When
        UserAlbumsResponseDTO result = profileService.getMyAlbums(userId, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAlbums()).hasSize(1);
        assertThat(result.getCurrentPage()).isEqualTo(0);
        assertThat(result.getTotalElements()).isEqualTo(2L);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.isHasNext()).isTrue();
        assertThat(result.isHasPrevious()).isFalse();
    }
}