package com.ssafy.lab.orak.profile.repository;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.repository.UserRepository;
import com.ssafy.lab.orak.follow.entity.Follow;
import com.ssafy.lab.orak.follow.repository.FollowRepository;
import com.ssafy.lab.orak.like.entity.Like;
import com.ssafy.lab.orak.like.repository.LikeRepository;
import com.ssafy.lab.orak.profile.entity.Profile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Repository 통합 테스트 - 마이페이지 기능")
class ProfileRepositoryIntegrationTest {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private FollowRepository followRepository;

    private User testUser1;
    private User testUser2;
    private User testUser3;
    private Profile testProfile1;
    private Profile testProfile2;
    private Profile testProfile3;
    private Album testAlbum1;
    private Album testAlbum2;
    private Album testAlbum3;

    @BeforeEach
    void setUp() {
        // 테스트 사용자들 생성
        testUser1 = User.builder()
                .email("user1@test.com")
                .googleID("google_user1")
                .build();

        testUser2 = User.builder()
                .email("user2@test.com")
                .googleID("google_user2")
                .build();

        testUser3 = User.builder()
                .email("user3@test.com")
                .googleID("google_user3")
                .build();

        testUser1 = userRepository.save(testUser1);
        testUser2 = userRepository.save(testUser2);
        testUser3 = userRepository.save(testUser3);

        // 테스트 프로필들 생성
        testProfile1 = Profile.builder()
                .user(testUser1)
                .nickname("사용자1")
                .description("사용자1 설명")
                .build();

        testProfile2 = Profile.builder()
                .user(testUser2)
                .nickname("사용자2")
                .description("사용자2 설명")
                .build();

        testProfile3 = Profile.builder()
                .user(testUser3)
                .nickname("사용자3")
                .description("사용자3 설명")
                .build();

        testProfile1 = profileRepository.save(testProfile1);
        testProfile2 = profileRepository.save(testProfile2);
        testProfile3 = profileRepository.save(testProfile3);

        // 테스트 앨범들 생성
        testAlbum1 = Album.builder()
                .userId(testUser1.getId())
                .title("사용자1의 앨범")
                .description("앨범 설명 1")
                .isPublic(true)
                .trackCount(5)
                .totalDuration(300)
                .likeCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testAlbum2 = Album.builder()
                .userId(testUser2.getId())
                .title("사용자2의 앨범")
                .description("앨범 설명 2")
                .isPublic(true)
                .trackCount(3)
                .totalDuration(180)
                .likeCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testAlbum3 = Album.builder()
                .userId(testUser2.getId())
                .title("사용자2의 또 다른 앨범")
                .description("앨범 설명 3")
                .isPublic(false)
                .trackCount(2)
                .totalDuration(120)
                .likeCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testAlbum1 = albumRepository.save(testAlbum1);
        testAlbum2 = albumRepository.save(testAlbum2);
        testAlbum3 = albumRepository.save(testAlbum3);
    }

    @Test
    @DisplayName("AlbumRepository - 사용자별 앨범 개수 조회")
    void albumRepository_countByUserId() {
        // When
        Long user1AlbumCount = albumRepository.countByUserId(testUser1.getId());
        Long user2AlbumCount = albumRepository.countByUserId(testUser2.getId());
        Long user3AlbumCount = albumRepository.countByUserId(testUser3.getId());

        // Then
        assertThat(user1AlbumCount).isEqualTo(1L);
        assertThat(user2AlbumCount).isEqualTo(2L);
        assertThat(user3AlbumCount).isEqualTo(0L);
    }

    @Test
    @DisplayName("AlbumRepository - 사용자별 앨범 목록 조회 (최신순)")
    void albumRepository_findByUserIdOrderByCreatedAtDesc() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Album> user1Albums = albumRepository.findByUserIdOrderByCreatedAtDesc(testUser1.getId(), pageable);
        Page<Album> user2Albums = albumRepository.findByUserIdOrderByCreatedAtDesc(testUser2.getId(), pageable);

        // Then
        assertThat(user1Albums.getContent()).hasSize(1);
        assertThat(user1Albums.getContent().get(0).getTitle()).isEqualTo("사용자1의 앨범");

        assertThat(user2Albums.getContent()).hasSize(2);
        assertThat(user2Albums.getContent().get(0).getTitle()).isEqualTo("사용자2의 또 다른 앨범");
        assertThat(user2Albums.getContent().get(1).getTitle()).isEqualTo("사용자2의 앨범");
    }

    @Test
    @DisplayName("LikeRepository - 사용자별 좋아요 개수 조회")
    void likeRepository_countByUserId() {
        // Given - 사용자1이 앨범2, 앨범3에 좋아요
        Like like1 = Like.builder()
                .userId(testUser1.getId())
                .albumId(testAlbum2.getId())
                .createdAt(LocalDateTime.now())
                .build();

        Like like2 = Like.builder()
                .userId(testUser1.getId())
                .albumId(testAlbum3.getId())
                .createdAt(LocalDateTime.now())
                .build();

        likeRepository.save(like1);
        likeRepository.save(like2);

        // When
        Long user1LikeCount = likeRepository.countByUserId(testUser1.getId());
        Long user2LikeCount = likeRepository.countByUserId(testUser2.getId());

        // Then
        assertThat(user1LikeCount).isEqualTo(2L);
        assertThat(user2LikeCount).isEqualTo(0L);
    }

    @Test
    @DisplayName("LikeRepository - 사용자가 좋아요한 앨범 목록 조회")
    void likeRepository_findLikedAlbumsByUserId() {
        // Given - 사용자1이 앨범2, 앨범3에 좋아요
        Like like1 = Like.builder()
                .userId(testUser1.getId())
                .albumId(testAlbum2.getId())
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        Like like2 = Like.builder()
                .userId(testUser1.getId())
                .albumId(testAlbum3.getId())
                .createdAt(LocalDateTime.now())
                .build();

        likeRepository.save(like1);
        likeRepository.save(like2);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Album> likedAlbums = likeRepository.findLikedAlbumsByUserId(testUser1.getId(), pageable);

        // Then
        assertThat(likedAlbums.getContent()).hasSize(2);
        assertThat(likedAlbums.getContent().get(0).getTitle()).isEqualTo("사용자2의 또 다른 앨범");
        assertThat(likedAlbums.getContent().get(1).getTitle()).isEqualTo("사용자2의 앨범");
    }

    @Test
    @DisplayName("FollowRepository - 팔로워 수 조회")
    void followRepository_countByFollowing() {
        // Given - 사용자2, 사용자3이 사용자1을 팔로우
        Follow follow1 = Follow.of(testProfile2, testProfile1);
        Follow follow2 = Follow.of(testProfile3, testProfile1);

        followRepository.save(follow1);
        followRepository.save(follow2);

        // When
        Long followerCount = followRepository.countByFollowing(testProfile1);

        // Then
        assertThat(followerCount).isEqualTo(2L);
    }

    @Test
    @DisplayName("FollowRepository - 팔로잉 수 조회")
    void followRepository_countByFollower() {
        // Given - 사용자1이 사용자2, 사용자3을 팔로우
        Follow follow1 = Follow.of(testProfile1, testProfile2);
        Follow follow2 = Follow.of(testProfile1, testProfile3);

        followRepository.save(follow1);
        followRepository.save(follow2);

        // When
        Long followingCount = followRepository.countByFollower(testProfile1);

        // Then
        assertThat(followingCount).isEqualTo(2L);
    }

    @Test
    @DisplayName("전체 통합 시나리오 - 마이페이지 통계")
    void fullIntegrationScenario_MyPageStats() {
        // Given - 복합적인 데이터 설정
        // 1. 사용자1이 앨범 2개 추가 생성
        Album additionalAlbum = Album.builder()
                .userId(testUser1.getId())
                .title("사용자1의 두 번째 앨범")
                .description("두 번째 앨범")
                .isPublic(true)
                .trackCount(4)
                .totalDuration(240)
                .likeCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        albumRepository.save(additionalAlbum);

        // 2. 사용자1이 다른 사용자 앨범에 좋아요
        Like like1 = Like.builder()
                .userId(testUser1.getId())
                .albumId(testAlbum2.getId())
                .createdAt(LocalDateTime.now())
                .build();
        likeRepository.save(like1);

        // 3. 다른 사용자들이 사용자1을 팔로우
        Follow follow1 = Follow.of(testProfile2, testProfile1);
        Follow follow2 = Follow.of(testProfile3, testProfile1);
        followRepository.save(follow1);
        followRepository.save(follow2);

        // 4. 사용자1이 다른 사용자를 팔로우
        Follow follow3 = Follow.of(testProfile1, testProfile2);
        followRepository.save(follow3);

        // When - 각 통계 조회
        Long albumCount = albumRepository.countByUserId(testUser1.getId());
        Long likedAlbumCount = likeRepository.countByUserId(testUser1.getId());
        Long followerCount = followRepository.countByFollowing(testProfile1);
        Long followingCount = followRepository.countByFollower(testProfile1);

        // Then
        assertThat(albumCount).isEqualTo(2L);
        assertThat(likedAlbumCount).isEqualTo(1L);
        assertThat(followerCount).isEqualTo(2L);
        assertThat(followingCount).isEqualTo(1L);
    }
}