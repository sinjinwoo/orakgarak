package com.ssafy.lab.orak.albumtrack.repository;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.albumtrack.entity.AlbumTrack;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("AlbumTrackRepository 테스트")
class AlbumTrackRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AlbumTrackRepository albumTrackRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UploadRepository uploadRepository;

    private Album testAlbum;
    private Record testRecord1;
    private Record testRecord2;
    private Record testRecord3;
    private Upload testUpload1;
    private Upload testUpload2;
    private Upload testUpload3;

    @BeforeEach
    void setUp() {
        // Upload 엔티티 생성 및 저장
        testUpload1 = Upload.builder()
                .originalFilename("test1")
                .uuid("uuid-1")
                .extension("mp3")
                .uploaderId(1L)
                .fileSize(1000L)
                .contentType("audio/mp3")
                .directory("records")
                .build();

        testUpload2 = Upload.builder()
                .originalFilename("test2")
                .uuid("uuid-2")
                .extension("mp3")
                .uploaderId(1L)
                .fileSize(2000L)
                .contentType("audio/mp3")
                .directory("records")
                .build();

        testUpload3 = Upload.builder()
                .originalFilename("test3")
                .uuid("uuid-3")
                .extension("mp3")
                .uploaderId(1L)
                .fileSize(3000L)
                .contentType("audio/mp3")
                .directory("records")
                .build();

        uploadRepository.save(testUpload1);
        uploadRepository.save(testUpload2);
        uploadRepository.save(testUpload3);

        // Album 엔티티 생성 및 저장
        testAlbum = Album.builder()
                .userId(1L)
                .title("테스트 앨범")
                .description("테스트 설명")
                .isPublic(true)
                .trackCount(0)
                .totalDuration(0)
                .likeCount(0)
                .build();

        albumRepository.save(testAlbum);

        // Record 엔티티 생성 및 저장
        testRecord1 = Record.builder()
                .userId(1L)
                .title("테스트 녹음 1")
                .uploadId(testUpload1.getId())
                .durationSeconds(120)
                .build();

        testRecord2 = Record.builder()
                .userId(1L)
                .title("테스트 녹음 2")
                .uploadId(testUpload2.getId())
                .durationSeconds(180)
                .build();

        testRecord3 = Record.builder()
                .userId(1L)
                .title("테스트 녹음 3")
                .uploadId(testUpload3.getId())
                .durationSeconds(240)
                .build();

        recordRepository.save(testRecord1);
        recordRepository.save(testRecord2);
        recordRepository.save(testRecord3);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    @DisplayName("앨범 ID로 트랙 순서대로 조회")
    void findByAlbumIdOrderByTrackOrder() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(2)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(1)
                .build();

        AlbumTrack track3 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord3)
                .trackOrder(3)
                .build();

        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        albumTrackRepository.save(track3);

        entityManager.flush();
        entityManager.clear();

        // When
        List<AlbumTrack> result = albumTrackRepository.findByAlbumIdOrderByTrackOrder(testAlbum.getId());

        // Then
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getTrackOrder()).isEqualTo(1);
        assertThat(result.get(1).getTrackOrder()).isEqualTo(2);
        assertThat(result.get(2).getTrackOrder()).isEqualTo(3);
        
        // Fetch Join 확인
        assertThat(result.get(0).getRecord()).isNotNull();
        assertThat(result.get(0).getRecord().getUpload()).isNotNull();
    }

    @Test
    @DisplayName("앨범 ID와 트랙 순서로 특정 트랙 조회")
    void findByAlbumIdAndTrackOrder() {
        // Given
        AlbumTrack track = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        albumTrackRepository.save(track);
        entityManager.flush();
        entityManager.clear();

        // When
        Optional<AlbumTrack> result = albumTrackRepository.findByAlbumIdAndTrackOrder(testAlbum.getId(), 1);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getTrackOrder()).isEqualTo(1);
        assertThat(result.get().getRecord().getTitle()).isEqualTo("테스트 녹음 1");
    }

    @Test
    @DisplayName("존재하지 않는 트랙 순서 조회 시 빈 결과 반환")
    void findByAlbumIdAndTrackOrder_NotFound() {
        // When
        Optional<AlbumTrack> result = albumTrackRepository.findByAlbumIdAndTrackOrder(testAlbum.getId(), 999);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("앨범 ID와 녹음 ID로 트랙 조회")
    void findByAlbumIdAndRecordId() {
        // Given
        AlbumTrack track = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        albumTrackRepository.save(track);
        entityManager.flush();
        entityManager.clear();

        // When
        Optional<AlbumTrack> result = albumTrackRepository.findByAlbumIdAndRecordId(testAlbum.getId(), testRecord1.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getRecord().getId()).isEqualTo(testRecord1.getId());
    }

    @Test
    @DisplayName("앨범의 트랙 개수 조회")
    void countByAlbumId() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(2)
                .build();

        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        entityManager.flush();

        // When
        Integer count = albumTrackRepository.countByAlbumId(testAlbum.getId());

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("앨범의 최대 트랙 순서 조회")
    void findMaxTrackOrderByAlbumId() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(3)
                .build();

        AlbumTrack track3 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord3)
                .trackOrder(2)
                .build();

        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        albumTrackRepository.save(track3);
        entityManager.flush();

        // When
        Integer maxOrder = albumTrackRepository.findMaxTrackOrderByAlbumId(testAlbum.getId());

        // Then
        assertThat(maxOrder).isEqualTo(3);
    }

    @Test
    @DisplayName("트랙이 없는 앨범의 최대 트랙 순서는 0")
    void findMaxTrackOrderByAlbumId_EmptyAlbum() {
        // When
        Integer maxOrder = albumTrackRepository.findMaxTrackOrderByAlbumId(testAlbum.getId());

        // Then
        assertThat(maxOrder).isEqualTo(0);
    }

    @Test
    @DisplayName("특정 순서보다 큰 트랙들 조회")
    void findByAlbumIdAndTrackOrderGreaterThan() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(2)
                .build();

        AlbumTrack track3 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord3)
                .trackOrder(3)
                .build();

        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        albumTrackRepository.save(track3);
        entityManager.flush();

        // When
        List<AlbumTrack> result = albumTrackRepository.findByAlbumIdAndTrackOrderGreaterThan(testAlbum.getId(), 1);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTrackOrder()).isEqualTo(2);
        assertThat(result.get(1).getTrackOrder()).isEqualTo(3);
    }

    @Test
    @DisplayName("앨범의 모든 트랙 삭제")
    void deleteByAlbumId() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(2)
                .build();

        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        entityManager.flush();

        // When
        albumTrackRepository.deleteByAlbumId(testAlbum.getId());
        entityManager.flush();

        // Then
        List<AlbumTrack> remainingTracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(testAlbum.getId());
        assertThat(remainingTracks).isEmpty();
    }

    @Test
    @DisplayName("유니크 제약조건 테스트 - 같은 앨범에서 순서 중복 불가")
    void uniqueConstraint_AlbumIdAndTrackOrder() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord2)
                .trackOrder(1) // 같은 순서
                .build();

        albumTrackRepository.save(track1);
        entityManager.flush();

        // When & Then
        try {
            albumTrackRepository.save(track2);
            entityManager.flush();
            // 예외가 발생해야 함
            assertThat(false).isTrue(); // 이 라인에 도달하면 안됨
        } catch (Exception e) {
            // 유니크 제약조건 위반으로 예외 발생 예상
            assertThat(e).isNotNull();
        }
    }

    @Test
    @DisplayName("유니크 제약조건 테스트 - 같은 앨범에서 녹음 파일 중복 불가")
    void uniqueConstraint_AlbumIdAndRecordId() {
        // Given
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1) // 같은 녹음 파일
                .trackOrder(2)
                .build();

        albumTrackRepository.save(track1);
        entityManager.flush();

        // When & Then
        try {
            albumTrackRepository.save(track2);
            entityManager.flush();
            // 예외가 발생해야 함
            assertThat(false).isTrue(); // 이 라인에 도달하면 안됨
        } catch (Exception e) {
            // 유니크 제약조건 위반으로 예외 발생 예상
            assertThat(e).isNotNull();
        }
    }

    @Test
    @DisplayName("다른 앨범에서는 같은 순서와 녹음 파일 사용 가능")
    void differentAlbums_AllowSameOrderAndRecord() {
        // Given
        Album anotherAlbum = Album.builder()
                .userId(1L)
                .title("다른 앨범")
                .isPublic(true)
                .trackCount(0)
                .totalDuration(0)
                .likeCount(0)
                .build();

        albumRepository.save(anotherAlbum);
        entityManager.flush();

        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        AlbumTrack track2 = AlbumTrack.builder()
                .album(anotherAlbum)
                .record(testRecord1) // 같은 녹음 파일
                .trackOrder(1) // 같은 순서
                .build();

        // When
        albumTrackRepository.save(track1);
        albumTrackRepository.save(track2);
        entityManager.flush();

        // Then
        List<AlbumTrack> album1Tracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(testAlbum.getId());
        List<AlbumTrack> album2Tracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(anotherAlbum.getId());

        assertThat(album1Tracks).hasSize(1);
        assertThat(album2Tracks).hasSize(1);
        assertThat(album1Tracks.get(0).getRecord().getId()).isEqualTo(album2Tracks.get(0).getRecord().getId());
    }

    @Test
    @DisplayName("Lazy Loading 테스트")
    void lazyLoading_Test() {
        // Given
        AlbumTrack track = AlbumTrack.builder()
                .album(testAlbum)
                .record(testRecord1)
                .trackOrder(1)
                .build();

        albumTrackRepository.save(track);
        entityManager.flush();
        entityManager.clear(); // 영속성 컨텍스트 클리어

        // When
        AlbumTrack foundTrack = albumTrackRepository.findById(track.getId()).get();

        // Then
        // Lazy 로딩이므로 프록시 객체여야 함
        assertThat(foundTrack.getAlbum()).isNotNull();
        assertThat(foundTrack.getRecord()).isNotNull();
    }
}