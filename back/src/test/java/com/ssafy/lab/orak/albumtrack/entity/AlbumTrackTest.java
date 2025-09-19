package com.ssafy.lab.orak.albumtrack.entity;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.recording.entity.Record;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AlbumTrack 엔티티 테스트")
class AlbumTrackTest {

    @Test
    @DisplayName("AlbumTrack 엔티티 생성 테스트")
    void createAlbumTrack() {
        // Given
        Album album = Album.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 앨범")
                .build();

        Record record = Record.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 녹음")
                .uploadId(1L)
                .durationSeconds(120)
                .build();

        // When
        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(album)
                .record(record)
                .trackOrder(1)
                .build();

        // Then
        assertThat(albumTrack.getAlbum()).isEqualTo(album);
        assertThat(albumTrack.getRecord()).isEqualTo(record);
        assertThat(albumTrack.getTrackOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("유효한 순서 검증 테스트")
    void isValidOrder() {
        // Given
        AlbumTrack albumTrack1 = AlbumTrack.builder()
                .trackOrder(1)
                .build();

        AlbumTrack albumTrack2 = AlbumTrack.builder()
                .trackOrder(0)
                .build();

        AlbumTrack albumTrack3 = AlbumTrack.builder()
                .trackOrder(null)
                .build();

        // When & Then
        assertThat(albumTrack1.isValidOrder()).isTrue();
        assertThat(albumTrack2.isValidOrder()).isFalse();
        assertThat(albumTrack3.isValidOrder()).isFalse();
    }

    @Test
    @DisplayName("앨범 소속 확인 테스트")
    void belongsToAlbum() {
        // Given
        Album album = Album.builder()
                .id(1L)
                .build();

        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(album)
                .build();

        // When & Then
        assertThat(albumTrack.belongsToAlbum(1L)).isTrue();
        assertThat(albumTrack.belongsToAlbum(2L)).isFalse();
    }

    @Test
    @DisplayName("앨범이 null일 때 소속 확인 테스트")
    void belongsToAlbumWhenAlbumIsNull() {
        // Given
        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(null)
                .build();

        // When & Then
        assertThat(albumTrack.belongsToAlbum(1L)).isFalse();
    }

    @Test
    @DisplayName("사용자 소유 확인 테스트")
    void isOwnedByUser() {
        // Given
        Album album = Album.builder()
                .id(1L)
                .userId(1L)
                .build();

        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(album)
                .build();

        // When & Then
        assertThat(albumTrack.isOwnedByUser(1L)).isTrue();
        assertThat(albumTrack.isOwnedByUser(2L)).isFalse();
    }

    @Test
    @DisplayName("앨범이 null일 때 소유 확인 테스트")
    void isOwnedByUserWhenAlbumIsNull() {
        // Given
        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(null)
                .build();

        // When & Then
        assertThat(albumTrack.isOwnedByUser(1L)).isFalse();
    }

    @Test
    @DisplayName("Builder 패턴 테스트")
    void builderTest() {
        // Given
        Album album = Album.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 앨범")
                .build();

        Record record = Record.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 녹음")
                .uploadId(1L)
                .build();

        // When
        AlbumTrack albumTrack = AlbumTrack.builder()
                .id(1L)
                .album(album)
                .record(record)
                .trackOrder(1)
                .build();

        // Then
        assertThat(albumTrack.getId()).isEqualTo(1L);
        assertThat(albumTrack.getAlbum()).isEqualTo(album);
        assertThat(albumTrack.getRecord()).isEqualTo(record);
        assertThat(albumTrack.getTrackOrder()).isEqualTo(1);
        assertThat(albumTrack.getCreatedAt()).isNull(); // @CreationTimestamp는 DB에서 처리
    }

    @Test
    @DisplayName("필드 setter 테스트")
    void setterTest() {
        // Given
        Album album1 = Album.builder().id(1L).build();
        Album album2 = Album.builder().id(2L).build();
        Record record1 = Record.builder().id(1L).build();
        Record record2 = Record.builder().id(2L).build();

        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(album1)
                .record(record1)
                .trackOrder(1)
                .build();

        // When
        albumTrack.setAlbum(album2);
        albumTrack.setRecord(record2);
        albumTrack.setTrackOrder(2);

        // Then
        assertThat(albumTrack.getAlbum()).isEqualTo(album2);
        assertThat(albumTrack.getRecord()).isEqualTo(record2);
        assertThat(albumTrack.getTrackOrder()).isEqualTo(2);
    }
}