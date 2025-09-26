package com.ssafy.lab.orak.album.controller;

import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.service.AlbumService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
@RequestMapping("/social")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
class SocialAlbumController {

    private final AlbumService albumService;

    @GetMapping("/albums")
    @Operation(summary = "공개 앨범 검색 및 목록 조회", description = "공개 앨범을 검색하고 목록을 조회합니다.")
    public ResponseEntity<Page<AlbumResponseDto>> getPublicAlbums(
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size,
            @RequestParam(required = false) @Parameter(description = "검색어") String keyword) {

        log.info("GET /api/social/albums - Getting public albums - page: {}, size: {}, keyword: {}",
                page, size, keyword);
        Page<AlbumResponseDto> albums = albumService.getPublicAlbums(page, size, keyword);
        return ResponseEntity.ok(albums);
    }

    @GetMapping("/albums/{albumId}")
    @Operation(summary = "공개 앨범 상세 조회", description = "공개 앨범의 상세 정보를 조회합니다.")
    public ResponseEntity<AlbumResponseDto> getPublicAlbum(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId) {

        log.info("GET /api/social/albums/{} - Getting public album", albumId);
        AlbumResponseDto album = albumService.getPublicAlbum(albumId);
        return ResponseEntity.ok(album);
    }

    @GetMapping("/albums/followed")
    @Operation(summary = "팔로우한 사용자의 공개 앨범 조회", description = "팔로우한 사용자들의 공개 앨범 목록을 조회합니다.")
    public ResponseEntity<Page<AlbumResponseDto>> getFollowedUsersAlbums(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size,
            @RequestParam(required = false) @Parameter(description = "검색어") String keyword) {

        Long currentUserId = principal.getUserId();
        log.info("GET /api/social/albums/followed - Getting followed users public albums - userId: {}, page: {}, size: {}, keyword: {}",
                currentUserId, page, size, keyword);

        Page<AlbumResponseDto> albums = albumService.getFollowedUsersPublicAlbums(currentUserId, page, size, keyword);
        return ResponseEntity.ok(albums);
    }
}