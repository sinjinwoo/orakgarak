package com.ssafy.lab.orak.albumtrack.service;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.exception.AlbumNotFoundException;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.albumtrack.dto.request.AddTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.BulkAddTracksRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.ReorderTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTrackResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTracksResponseDTO;
import com.ssafy.lab.orak.albumtrack.entity.AlbumTrack;
import com.ssafy.lab.orak.albumtrack.exception.AlbumTrackException;
import com.ssafy.lab.orak.albumtrack.exception.TrackOrderConflictException;
import com.ssafy.lab.orak.albumtrack.repository.AlbumTrackRepository;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlbumTrackService 테스트")
class AlbumTrackServiceTest {

    @Mock
    private AlbumTrackRepository albumTrackRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private RecordRepository recordRepository;

    @Mock
    private FileUploadService fileUploadService;

    @InjectMocks
    private AlbumTrackService albumTrackService;

    private Album testAlbum;
    private Record testRecord;
    private AlbumTrack testAlbumTrack;
    private AddTrackRequestDTO addTrackRequest;
    
    private ArgumentCaptor<Album> albumCaptor;

    @BeforeEach
    void setUp() {
        albumCaptor = ArgumentCaptor.forClass(Album.class);
        
        testAlbum = Album.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 앨범")
                .trackCount(0)
                .totalDuration(0)
                .isPublic(true)
                .build();

        testRecord = Record.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 녹음")
                .uploadId(1L)
                .durationSeconds(120)
                .build();

        testAlbumTrack = AlbumTrack.builder()
                .id(1L)
                .album(testAlbum)
                .record(testRecord)
                .trackOrder(1)
                .build();

        addTrackRequest = AddTrackRequestDTO.builder()
                .recordId(1L)
                .trackOrder(1)
                .build();
    }

    @Test
    @DisplayName("앨범 트랙 목록 조회 성공")
    void getAlbumTracks_Success() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        List<AlbumTrack> tracks = Arrays.asList(testAlbumTrack);
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId)).thenReturn(tracks);
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        AlbumTracksResponseDTO result = albumTrackService.getAlbumTracks(albumId, userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAlbumId()).isEqualTo(albumId);
        assertThat(result.getAlbumTitle()).isEqualTo("테스트 앨범");
        assertThat(result.getTotalTracks()).isEqualTo(1);
        assertThat(result.getTracks()).hasSize(1);
        
        AlbumTrackResponseDTO trackDto = result.getTracks().get(0);
        assertThat(trackDto.getRecordTitle()).isEqualTo("테스트 녹음");
        assertThat(trackDto.getTrackOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("존재하지 않는 앨범 조회 시 예외 발생")
    void getAlbumTracks_AlbumNotFound() {
        // Given
        Long albumId = 999L;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> albumTrackService.getAlbumTracks(albumId, userId))
                .isInstanceOf(AlbumNotFoundException.class);
    }

    @Test
    @DisplayName("비공개 앨범에 접근 권한 없을 때 예외 발생")
    void getAlbumTracks_AccessDenied() {
        // Given
        Long albumId = 1L;
        Long userId = 2L; // 다른 사용자
        
        Album privateAlbum = Album.builder()
                .id(1L)
                .userId(1L)
                .isPublic(false)
                .build();
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(privateAlbum));

        // When & Then
        assertThatThrownBy(() -> albumTrackService.getAlbumTracks(albumId, userId))
                .isInstanceOf(AlbumTrackException.class)
                .hasMessage("앨범에 접근할 권한이 없습니다");
    }

    @Test
    @DisplayName("트랙 추가 성공")
    void addTrack_Success() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(recordRepository.findById(1L)).thenReturn(Optional.of(testRecord));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 1)).thenReturn(Optional.empty());
        when(albumTrackRepository.findByAlbumIdAndRecordId(albumId, 1L)).thenReturn(Optional.empty());
        when(albumTrackRepository.save(any(AlbumTrack.class))).thenReturn(testAlbumTrack);
        when(albumTrackRepository.countByAlbumId(albumId)).thenReturn(1);
        when(albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId)).thenReturn(Arrays.asList(testAlbumTrack));
        when(albumRepository.save(any(Album.class))).thenReturn(testAlbum);
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        AlbumTrackResponseDTO result = albumTrackService.addTrack(albumId, addTrackRequest, userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRecordId()).isEqualTo(1L);
        assertThat(result.getTrackOrder()).isEqualTo(1);
        
        verify(albumTrackRepository).save(any(AlbumTrack.class));
        verify(albumRepository).save(any(Album.class)); // trackCount 업데이트
    }

    @Test
    @DisplayName("앨범 소유자가 아닐 때 트랙 추가 실패")
    void addTrack_NotOwner() {
        // Given
        Long albumId = 1L;
        Long userId = 2L; // 다른 사용자
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));

        // When & Then
        assertThatThrownBy(() -> albumTrackService.addTrack(albumId, addTrackRequest, userId))
                .isInstanceOf(AlbumTrackException.class)
                .hasMessage("앨범을 수정할 권한이 없습니다");
    }

    @Test
    @DisplayName("최대 트랙 수 초과 시 트랙 추가 실패")
    void addTrack_MaxTracksExceeded() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        Album fullAlbum = Album.builder()
                .id(1L)
                .userId(1L)
                .trackCount(10) // 최대 트랙 수
                .build();
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(fullAlbum));

        // When & Then
        assertThatThrownBy(() -> albumTrackService.addTrack(albumId, addTrackRequest, userId))
                .isInstanceOf(AlbumTrackException.class)
                .hasMessage("앨범에 더 이상 트랙을 추가할 수 없습니다 (최대 10개)");
    }

    @Test
    @DisplayName("존재하지 않는 녹음 파일로 트랙 추가 실패")
    void addTrack_RecordNotFound() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(recordRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> albumTrackService.addTrack(albumId, addTrackRequest, userId))
                .isInstanceOf(RecordNotFoundException.class);
    }

    @Test
    @DisplayName("순서 중복 시 트랙 추가 실패")
    void addTrack_OrderConflict() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(recordRepository.findById(1L)).thenReturn(Optional.of(testRecord));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 1)).thenReturn(Optional.of(testAlbumTrack));

        // When & Then
        assertThatThrownBy(() -> albumTrackService.addTrack(albumId, addTrackRequest, userId))
                .isInstanceOf(TrackOrderConflictException.class)
                .hasMessage("해당 순서에 이미 트랙이 존재합니다");
    }

    @Test
    @DisplayName("같은 녹음 파일 중복 추가 실패")
    void addTrack_DuplicateRecord() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(recordRepository.findById(1L)).thenReturn(Optional.of(testRecord));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 1)).thenReturn(Optional.empty());
        when(albumTrackRepository.findByAlbumIdAndRecordId(albumId, 1L)).thenReturn(Optional.of(testAlbumTrack));

        // When & Then
        assertThatThrownBy(() -> albumTrackService.addTrack(albumId, addTrackRequest, userId))
                .isInstanceOf(AlbumTrackException.class)
                .hasMessage("이미 앨범에 추가된 녹음 파일입니다");
    }

    @Test
    @DisplayName("여러 트랙 일괄 추가 성공")
    void addTracks_Success() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        List<AddTrackRequestDTO> tracks = Arrays.asList(
                AddTrackRequestDTO.builder().recordId(1L).trackOrder(1).build(),
                AddTrackRequestDTO.builder().recordId(2L).trackOrder(2).build()
        );
        
        BulkAddTracksRequestDTO bulkRequest = BulkAddTracksRequestDTO.builder()
                .tracks(tracks)
                .build();
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(albumTrackRepository.countByAlbumId(albumId)).thenReturn(0);
        
        // 각 트랙 추가를 위한 mock 설정
        when(recordRepository.findById(anyLong())).thenReturn(Optional.of(testRecord));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(anyLong(), anyInt())).thenReturn(Optional.empty());
        when(albumTrackRepository.findByAlbumIdAndRecordId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(albumTrackRepository.save(any(AlbumTrack.class))).thenReturn(testAlbumTrack);
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        List<AlbumTrackResponseDTO> result = albumTrackService.addTracks(albumId, bulkRequest, userId);

        // Then
        assertThat(result).hasSize(2);
        verify(albumTrackRepository, times(2)).save(any(AlbumTrack.class));
    }

    @Test
    @DisplayName("트랙 삭제 성공")
    void removeTrack_Success() {
        // Given
        Long albumId = 1L;
        Integer trackOrder = 1;
        Long userId = 1L;
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, trackOrder)).thenReturn(Optional.of(testAlbumTrack));
        when(albumTrackRepository.findByAlbumIdAndTrackOrderGreaterThan(albumId, trackOrder)).thenReturn(Arrays.asList());
        when(albumTrackRepository.countByAlbumId(albumId)).thenReturn(0);

        // When
        albumTrackService.removeTrack(albumId, trackOrder, userId);

        // Then
        verify(albumTrackRepository).delete(testAlbumTrack);
        verify(albumRepository).save(any(Album.class)); // trackCount 업데이트
    }

    @Test
    @DisplayName("트랙 순서 변경 성공")
    void reorderTrack_Success() {
        // Given
        Long albumId = 1L;
        Long userId = 1L;
        
        ReorderTrackRequestDTO reorderRequest = ReorderTrackRequestDTO.builder()
                .fromOrder(1)
                .toOrder(2)
                .build();
        
        AlbumTrack track1 = AlbumTrack.builder().id(1L).trackOrder(1).build();
        AlbumTrack track2 = AlbumTrack.builder().id(2L).trackOrder(2).build();
        
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 1)).thenReturn(Optional.of(track1));
        when(albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId)).thenReturn(Arrays.asList(track1, track2));
        when(albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId)).thenReturn(Arrays.asList(testAlbumTrack));
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        AlbumTracksResponseDTO result = albumTrackService.reorderTrack(albumId, reorderRequest, userId);

        // Then
        assertThat(result).isNotNull();
        verify(albumTrackRepository).saveAll(any(List.class));
    }

    @Test
    @DisplayName("다음 트랙 조회 성공")
    void getNextTrack_Success() {
        // Given
        Long albumId = 1L;
        Integer currentOrder = 1;
        Long userId = 1L;
        
        AlbumTrack nextTrack = AlbumTrack.builder()
                .id(2L)
                .album(testAlbum)
                .record(testRecord)
                .trackOrder(2)
                .build();
        
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 2)).thenReturn(Optional.of(nextTrack));
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        AlbumTrackResponseDTO result = albumTrackService.getNextTrack(albumId, currentOrder, userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTrackOrder()).isEqualTo(2);
    }

    @Test
    @DisplayName("다음 트랙이 없을 때 null 반환")
    void getNextTrack_NoNext() {
        // Given
        Long albumId = 1L;
        Integer currentOrder = 1;
        Long userId = 1L;
        
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 2)).thenReturn(Optional.empty());

        // When
        AlbumTrackResponseDTO result = albumTrackService.getNextTrack(albumId, currentOrder, userId);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("이전 트랙 조회 성공")
    void getPreviousTrack_Success() {
        // Given
        Long albumId = 1L;
        Integer currentOrder = 2;
        Long userId = 1L;
        
        when(albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, 1)).thenReturn(Optional.of(testAlbumTrack));
        when(fileUploadService.getFileUrl(anyLong())).thenReturn("http://test-url.com/audio.mp3");

        // When
        AlbumTrackResponseDTO result = albumTrackService.getPreviousTrack(albumId, currentOrder, userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTrackOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("첫 번째 트랙에서 이전 트랙 조회 시 null 반환")
    void getPreviousTrack_FirstTrack() {
        // Given
        Long albumId = 1L;
        Integer currentOrder = 1;
        Long userId = 1L;

        // When
        AlbumTrackResponseDTO result = albumTrackService.getPreviousTrack(albumId, currentOrder, userId);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("앨범 통계 업데이트 - 총 재생시간 자동 계산")
    void updateAlbumStatistics_TotalDurationCalculation() {
        // Given
        Long albumId = 1L;
        
        // 두 개의 트랙을 가진 앨범 모킹 (120초, 180초)
        Record record1 = Record.builder()
                .id(1L)
                .durationSeconds(120)
                .build();
        Record record2 = Record.builder()
                .id(2L)
                .durationSeconds(180)
                .build();
        
        AlbumTrack track1 = AlbumTrack.builder()
                .album(testAlbum)
                .record(record1)
                .trackOrder(1)
                .build();
        AlbumTrack track2 = AlbumTrack.builder()
                .album(testAlbum)
                .record(record2)
                .trackOrder(2)
                .build();
        
        List<AlbumTrack> tracks = Arrays.asList(track1, track2);
        
        when(albumTrackRepository.countByAlbumId(albumId)).thenReturn(2);
        when(albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId)).thenReturn(tracks);
        when(albumRepository.findById(albumId)).thenReturn(Optional.of(testAlbum));
        when(albumRepository.save(any(Album.class))).thenReturn(testAlbum);

        // When
        albumTrackService.refreshAlbumStatistics(albumId);

        // Then
        verify(albumRepository).save(albumCaptor.capture());
        Album savedAlbum = albumCaptor.getValue();
        
        assertThat(savedAlbum.getTrackCount()).isEqualTo(2);
        assertThat(savedAlbum.getTotalDuration()).isEqualTo(300); // 120 + 180 = 300초
    }

}