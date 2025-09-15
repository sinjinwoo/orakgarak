package com.ssafy.lab.orak.albumtrack.controller;

import com.ssafy.lab.orak.albumtrack.dto.request.AddTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.BulkAddTracksRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.request.ReorderTrackRequestDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTrackResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.AlbumTracksResponseDTO;
import com.ssafy.lab.orak.albumtrack.dto.response.PlaybackResponseDTO;
import com.ssafy.lab.orak.albumtrack.service.AlbumTrackService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Album Track API", description = "앨범 트랙 관리 API")
@RestController
@RequestMapping("/api/albums/{albumId}/tracks")
@RequiredArgsConstructor
@Log4j2
public class AlbumTrackController {

    private final AlbumTrackService albumTrackService;

    @Operation(summary = "앨범 트랙 목록 조회", description = "앨범의 모든 트랙을 순서대로 조회합니다")
    @ApiResponse(responseCode = "200", description = "트랙 목록 조회 성공")
    @GetMapping
    public ResponseEntity<AlbumTracksResponseDTO> getAlbumTracks(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTracksResponseDTO tracks = albumTrackService.getAlbumTracks(albumId, currentUser.getUserId());
        return ResponseEntity.ok(tracks);
    }

    @Operation(summary = "특정 트랙 조회", description = "앨범의 특정 순서 트랙을 조회합니다")
    @ApiResponse(responseCode = "200", description = "트랙 조회 성공")
    @GetMapping("/{trackOrder}")
    public ResponseEntity<AlbumTrackResponseDTO> getTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Parameter(description = "트랙 순서") @PathVariable Integer trackOrder,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO track = albumTrackService.getTrack(albumId, trackOrder, currentUser.getUserId());
        return ResponseEntity.ok(track);
    }

    @Operation(summary = "트랙 추가", description = "앨범에 새로운 트랙을 추가합니다")
    @ApiResponse(responseCode = "201", description = "트랙 추가 성공")
    @PostMapping
    public ResponseEntity<AlbumTrackResponseDTO> addTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Valid @RequestBody AddTrackRequestDTO request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO track = albumTrackService.addTrack(albumId, request, currentUser.getUserId());
        return ResponseEntity.status(201).body(track);
    }

    @Operation(summary = "여러 트랙 일괄 추가", description = "앨범에 여러 트랙을 한번에 추가합니다")
    @ApiResponse(responseCode = "201", description = "트랙 일괄 추가 성공")
    @PostMapping("/bulk")
    public ResponseEntity<List<AlbumTrackResponseDTO>> addTracks(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Valid @RequestBody BulkAddTracksRequestDTO request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        List<AlbumTrackResponseDTO> tracks = albumTrackService.addTracks(albumId, request, currentUser.getUserId());
        return ResponseEntity.status(201).body(tracks);
    }

    @Operation(summary = "트랙 삭제", description = "앨범에서 특정 트랙을 삭제합니다")
    @ApiResponse(responseCode = "204", description = "트랙 삭제 성공")
    @DeleteMapping("/{trackOrder}")
    public ResponseEntity<Void> removeTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Parameter(description = "트랙 순서") @PathVariable Integer trackOrder,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        albumTrackService.removeTrack(albumId, trackOrder, currentUser.getUserId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "트랙 순서 변경", description = "트랙의 순서를 변경합니다")
    @ApiResponse(responseCode = "200", description = "트랙 순서 변경 성공")
    @PutMapping("/reorder")
    public ResponseEntity<AlbumTracksResponseDTO> reorderTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Valid @RequestBody ReorderTrackRequestDTO request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTracksResponseDTO tracks = albumTrackService.reorderTrack(albumId, request, currentUser.getUserId());
        return ResponseEntity.ok(tracks);
    }

    @Operation(summary = "다음 트랙 조회", description = "현재 트랙의 다음 트랙을 조회합니다")
    @ApiResponse(responseCode = "200", description = "다음 트랙 조회 성공")
    @GetMapping("/{trackOrder}/next")
    public ResponseEntity<AlbumTrackResponseDTO> getNextTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Parameter(description = "현재 트랙 순서") @PathVariable Integer trackOrder,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO nextTrack = albumTrackService.getNextTrack(albumId, trackOrder, currentUser.getUserId());
        if (nextTrack == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(nextTrack);
    }

    @Operation(summary = "이전 트랙 조회", description = "현재 트랙의 이전 트랙을 조회합니다")
    @ApiResponse(responseCode = "200", description = "이전 트랙 조회 성공")
    @GetMapping("/{trackOrder}/previous")
    public ResponseEntity<AlbumTrackResponseDTO> getPreviousTrack(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Parameter(description = "현재 트랙 순서") @PathVariable Integer trackOrder,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO previousTrack = albumTrackService.getPreviousTrack(albumId, trackOrder, currentUser.getUserId());
        if (previousTrack == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(previousTrack);
    }

    // 플레이어 관련 API

    @Operation(summary = "앨범 재생 시작", description = "앨범의 첫 번째 트랙부터 재생을 시작합니다")
    @ApiResponse(responseCode = "200", description = "재생 시작 성공")
    @PostMapping("/play")
    public ResponseEntity<PlaybackResponseDTO> startAlbumPlayback(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO firstTrack = albumTrackService.getTrack(albumId, 1, currentUser.getUserId());
        AlbumTrackResponseDTO nextTrack = albumTrackService.getNextTrack(albumId, 1, currentUser.getUserId());
        AlbumTracksResponseDTO albumTracks = albumTrackService.getAlbumTracks(albumId, currentUser.getUserId());
        
        PlaybackResponseDTO playback = PlaybackResponseDTO.builder()
                .currentTrack(firstTrack)
                .nextTrack(nextTrack)
                .previousTrack(null)
                .hasNext(nextTrack != null)
                .hasPrevious(false)
                .totalTracks(albumTracks.getTotalTracks())
                .build();
                
        return ResponseEntity.ok(playback);
    }

    @Operation(summary = "특정 트랙부터 재생", description = "앨범의 특정 트랙부터 재생을 시작합니다")
    @ApiResponse(responseCode = "200", description = "재생 시작 성공")
    @PostMapping("/{trackOrder}/play")
    public ResponseEntity<PlaybackResponseDTO> startTrackPlayback(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @Parameter(description = "시작할 트랙 순서") @PathVariable Integer trackOrder,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTrackResponseDTO currentTrack = albumTrackService.getTrack(albumId, trackOrder, currentUser.getUserId());
        AlbumTrackResponseDTO nextTrack = albumTrackService.getNextTrack(albumId, trackOrder, currentUser.getUserId());
        AlbumTrackResponseDTO previousTrack = albumTrackService.getPreviousTrack(albumId, trackOrder, currentUser.getUserId());
        AlbumTracksResponseDTO albumTracks = albumTrackService.getAlbumTracks(albumId, currentUser.getUserId());
        
        PlaybackResponseDTO playback = PlaybackResponseDTO.builder()
                .currentTrack(currentTrack)
                .nextTrack(nextTrack)
                .previousTrack(previousTrack)
                .hasNext(nextTrack != null)
                .hasPrevious(previousTrack != null)
                .totalTracks(albumTracks.getTotalTracks())
                .build();
                
        return ResponseEntity.ok(playback);
    }

    @Operation(summary = "셔플 재생", description = "앨범의 트랙들을 무작위 순서로 재생 목록을 생성합니다")
    @ApiResponse(responseCode = "200", description = "셔플 재생 목록 생성 성공")
    @PostMapping("/shuffle")
    public ResponseEntity<AlbumTracksResponseDTO> getShuffledPlaylist(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal currentUser) {
        
        AlbumTracksResponseDTO tracks = albumTrackService.getAlbumTracks(albumId, currentUser.getUserId());
        // 클라이언트에서 셔플 처리하도록 원본 목록 반환
        return ResponseEntity.ok(tracks);
    }
}