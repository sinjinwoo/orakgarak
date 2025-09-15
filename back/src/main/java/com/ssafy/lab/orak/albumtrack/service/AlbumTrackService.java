package com.ssafy.lab.orak.albumtrack.service;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.exception.AlbumNotFoundException;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.albumtrack.dto.request.AddTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.BulkAddTracksRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.ReorderTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTrackResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTracksResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.PlaybackResponseDTO;
import com.ssafy.lab.orak.albumtrack.entity.AlbumTrack;
import com.ssafy.lab.orak.albumtrack.exception.AlbumTrackException;
import com.ssafy.lab.orak.albumtrack.exception.TrackOrderConflictException;
import com.ssafy.lab.orak.albumtrack.repository.AlbumTrackRepository;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional(readOnly = true)
public class AlbumTrackService {

    private final AlbumTrackRepository albumTrackRepository;
    private final AlbumRepository albumRepository;
    private final RecordRepository recordRepository;
    private final FileUploadService fileUploadService;

    // 앨범의 모든 트랙 조회 (순서대로)
    public AlbumTracksResponseDTO getAlbumTracks(Long albumId, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.canBeAccessedBy(userId)) {
            throw new AlbumTrackException("앨범에 접근할 권한이 없습니다");
        }

        List<AlbumTrack> tracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId);
        
        List<AlbumTrackResponseDTO> trackDtos = tracks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());

        // 앨범 커버 이미지 URL 생성
        String coverImageUrl = null;
        if (album.getUploadId() != null) {
            try {
                coverImageUrl = fileUploadService.getFileUrl(album.getUploadId());
            } catch (Exception e) {
                log.warn("Failed to generate cover image URL for album {}: {}", albumId, e.getMessage());
            }
        }

        return AlbumTracksResponseDTO.builder()
                .albumId(albumId)
                .albumTitle(album.getTitle())
                .coverImageUrl(coverImageUrl)
                .totalTracks(tracks.size())
                .totalDuration(album.getTotalDuration())
                .tracks(trackDtos)
                .build();
    }

    // 특정 트랙 조회
    public AlbumTrackResponseDTO getTrack(Long albumId, Integer trackOrder, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.canBeAccessedBy(userId)) {
            throw new AlbumTrackException("앨범에 접근할 권한이 없습니다");
        }

        AlbumTrack track = albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, trackOrder)
                .orElseThrow(() -> new AlbumTrackException("트랙을 찾을 수 없습니다"));

        return convertToResponseDTO(track);
    }

    // 트랙 추가
    @Transactional
    public AlbumTrackResponseDTO addTrack(Long albumId, AddTrackRequestDTO request, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.isOwnedBy(userId)) {
            throw new AlbumTrackException("앨범을 수정할 권한이 없습니다");
        }

        if (!album.canAddTrack()) {
            throw new AlbumTrackException("앨범에 더 이상 트랙을 추가할 수 없습니다 (최대 10개)");
        }

        Record record = recordRepository.findById(request.getRecordId())
                .orElseThrow(() -> new RecordNotFoundException(request.getRecordId()));

        if (!record.getUserId().equals(userId)) {
            throw new AlbumTrackException("녹음 파일에 접근할 권한이 없습니다");
        }

        // 순서 중복 체크
        if (albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, request.getTrackOrder()).isPresent()) {
            throw new TrackOrderConflictException("해당 순서에 이미 트랙이 존재합니다");
        }

        // 같은 녹음 파일 중복 체크
        if (albumTrackRepository.findByAlbumIdAndRecordId(albumId, request.getRecordId()).isPresent()) {
            throw new AlbumTrackException("이미 앨범에 추가된 녹음 파일입니다");
        }

        AlbumTrack albumTrack = AlbumTrack.builder()
                .album(album)
                .record(record)
                .trackOrder(request.getTrackOrder())
                .build();

        AlbumTrack savedTrack = albumTrackRepository.save(albumTrack);

        // 앨범 통계 업데이트 (트랙 수, 총 재생시간)
        updateAlbumStatistics(albumId);

        log.info("트랙 추가 성공 - 앨범ID: {}, 녹음ID: {}, 순서: {}", albumId, request.getRecordId(), request.getTrackOrder());
        return convertToResponseDTO(savedTrack);
    }

    // 여러 트랙 일괄 추가
    @Transactional
    public List<AlbumTrackResponseDTO> addTracks(Long albumId, BulkAddTracksRequestDTO request, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.isOwnedBy(userId)) {
            throw new AlbumTrackException("앨범을 수정할 권한이 없습니다");
        }

        int currentTrackCount = albumTrackRepository.countByAlbumId(albumId);
        if (currentTrackCount + request.getTracks().size() > 10) {
            throw new AlbumTrackException("앨범에 추가할 수 있는 트랙 수를 초과했습니다 (최대 10개)");
        }

        return request.getTracks().stream()
                .map(trackItem -> addTrack(albumId, trackItem, userId))
                .collect(Collectors.toList());
    }

    // 트랙 삭제
    @Transactional
    public void removeTrack(Long albumId, Integer trackOrder, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.isOwnedBy(userId)) {
            throw new AlbumTrackException("앨범을 수정할 권한이 없습니다");
        }

        AlbumTrack track = albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, trackOrder)
                .orElseThrow(() -> new AlbumTrackException("트랙을 찾을 수 없습니다"));

        albumTrackRepository.delete(track);

        // 뒤의 트랙들 순서 앞당기기
        reorderTracksAfterDeletion(albumId, trackOrder);

        // 앨범 통계 업데이트 (트랙 수, 총 재생시간)
        updateAlbumStatistics(albumId);

        log.info("트랙 삭제 성공 - 앨범ID: {}, 순서: {}", albumId, trackOrder);
    }

    // 트랙 순서 변경
    @Transactional
    public AlbumTracksResponseDTO reorderTrack(Long albumId, ReorderTrackRequestDTO request, Long userId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));

        if (!album.isOwnedBy(userId)) {
            throw new AlbumTrackException("앨범을 수정할 권한이 없습니다");
        }

        AlbumTrack trackToMove = albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, request.getFromOrder())
                .orElseThrow(() -> new AlbumTrackException("이동할 트랙을 찾을 수 없습니다"));

        // 순서 재정렬 로직 실행
        reorderTracks(albumId, request.getFromOrder(), request.getToOrder());

        log.info("트랙 순서 변경 성공 - 앨범ID: {}, {}번 → {}번", albumId, request.getFromOrder(), request.getToOrder());
        
        return getAlbumTracks(albumId, userId);
    }

    // 다음 트랙 조회
    public AlbumTrackResponseDTO getNextTrack(Long albumId, Integer currentOrder, Long userId) {
        return albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, currentOrder + 1)
                .map(this::convertToResponseDTO)
                .orElse(null);
    }

    // 이전 트랙 조회
    public AlbumTrackResponseDTO getPreviousTrack(Long albumId, Integer currentOrder, Long userId) {
        if (currentOrder <= 1) {
            return null;
        }
        return albumTrackRepository.findByAlbumIdAndTrackOrder(albumId, currentOrder - 1)
                .map(this::convertToResponseDTO)
                .orElse(null);
    }

    // 앨범 통계 수동 업데이트 (외부 호출용)
    @Transactional
    public void refreshAlbumStatistics(Long albumId) {
        updateAlbumStatistics(albumId);
    }

    // === Private Helper Methods ===

    private void updateAlbumStatistics(Long albumId) {
        Integer trackCount = albumTrackRepository.countByAlbumId(albumId);
        
        // 모든 트랙의 총 재생시간 계산
        List<AlbumTrack> tracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId);
        Integer totalDuration = tracks.stream()
                .mapToInt(track -> track.getRecord().getDurationSeconds())
                .sum();
        
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));
        
        album.setTrackCount(trackCount);
        album.setTotalDuration(totalDuration);
        albumRepository.save(album);
        
        log.info("앨범 통계 업데이트 - 앨범ID: {}, 트랙수: {}, 총재생시간: {}초", albumId, trackCount, totalDuration);
    }

    private void reorderTracksAfterDeletion(Long albumId, Integer deletedOrder) {
        List<AlbumTrack> tracksToReorder = albumTrackRepository
                .findByAlbumIdAndTrackOrderGreaterThan(albumId, deletedOrder);

        for (AlbumTrack track : tracksToReorder) {
            track.setTrackOrder(track.getTrackOrder() - 1);
        }
        albumTrackRepository.saveAll(tracksToReorder);
    }

    private void reorderTracks(Long albumId, Integer fromOrder, Integer toOrder) {
        if (fromOrder.equals(toOrder)) {
            return;
        }

        List<AlbumTrack> allTracks = albumTrackRepository.findByAlbumIdOrderByTrackOrder(albumId);
        
        if (fromOrder < toOrder) {
            // 앞에서 뒤로 이동: 중간 트랙들을 앞으로 한 칸씩
            for (AlbumTrack track : allTracks) {
                if (track.getTrackOrder() > fromOrder && track.getTrackOrder() <= toOrder) {
                    track.setTrackOrder(track.getTrackOrder() - 1);
                } else if (track.getTrackOrder().equals(fromOrder)) {
                    track.setTrackOrder(toOrder);
                }
            }
        } else {
            // 뒤에서 앞으로 이동: 중간 트랙들을 뒤로 한 칸씩
            for (AlbumTrack track : allTracks) {
                if (track.getTrackOrder() >= toOrder && track.getTrackOrder() < fromOrder) {
                    track.setTrackOrder(track.getTrackOrder() + 1);
                } else if (track.getTrackOrder().equals(fromOrder)) {
                    track.setTrackOrder(toOrder);
                }
            }
        }
        
        albumTrackRepository.saveAll(allTracks);
    }

    private AlbumTrackResponseDTO convertToResponseDTO(AlbumTrack albumTrack) {
        String audioUrl = fileUploadService.getFileUrl(albumTrack.getRecord().getUploadId());
        
        return AlbumTrackResponseDTO.builder()
                .id(albumTrack.getId())
                .albumId(albumTrack.getAlbum().getId())
                .recordId(albumTrack.getRecord().getId())
                .recordTitle(albumTrack.getRecord().getTitle())
                .trackOrder(albumTrack.getTrackOrder())
                .durationSeconds(albumTrack.getRecord().getDurationSeconds())
                .audioUrl(audioUrl)
                .build();
    }
}