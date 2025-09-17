package com.ssafy.lab.orak.album.controller;

import com.ssafy.lab.orak.album.dto.AlbumCreateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumUpdateRequestDto;
import com.ssafy.lab.orak.album.service.AlbumService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlbumController {

    private final AlbumService albumService;

    //    앨범 생성
    @PostMapping
    @Operation(summary = "앨범 생성", description = "새로운 앨범을 생성합니다.")
    public ResponseEntity<AlbumResponseDto> createAlbum(
            @RequestBody @Valid AlbumCreateRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("POST /api/albums - Creating album by user: {}", userId);
        AlbumResponseDto response = albumService.createAlbum(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    //    전체 앨범 조회
    @GetMapping
    @Operation(summary = "앨범 조회", description = "전체 앨범을 조회합니다.")
    public ResponseEntity<Page<AlbumResponseDto>> getAllAlbums(
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size) {

        log.info("GET /api/albums - Getting all albums - page: {}, size: {}", page, size);
        Page<AlbumResponseDto> albums = albumService.getAllAlbums(page, size);
        return ResponseEntity.ok(albums);
    }

    //    특정 앨범 조회
    @GetMapping("/{albumId}")
    @Operation(summary = "특정 앨범 조회", description = "앨범 ID로 특정 앨범을 조회합니다.")
    public ResponseEntity<AlbumResponseDto> getAlbum(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        Long userId = principal.getUserId();
        log.info("GET /api/albums/{} - Getting album by user: {}", albumId, userId);
        AlbumResponseDto album = albumService.getAlbum(albumId, userId);
        return ResponseEntity.ok(album);
    }

    //    앨범 수정
    @PutMapping("/{albumId}")
    @Operation(summary = "앨범 수정", description = "기존 앨범 정보를 수정합니다.")
    public ResponseEntity<AlbumResponseDto> updateAlbum(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @RequestBody @Valid AlbumUpdateRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("PUT /api/albums/{} - Updating album by user: {}", albumId, userId);
        AlbumResponseDto response = albumService.updateAlbum(userId, albumId, request);
        return  ResponseEntity.status(HttpStatus.OK).body(response);

    }


//    앨범 삭제
    @DeleteMapping("/{albumId}")
    @Operation(summary = "앨범 삭제", description = "앨범을 삭제합니다.")
    public ResponseEntity<Void> deleteAlbum(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("DELETE /api/albums/{} - Deleting album by user: {}", albumId, userId);
        albumService.deleteAlbum(albumId, userId);
        return ResponseEntity.noContent().build();
    }

}

@Slf4j
@RestController
@RequestMapping("/api/social")
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

        log.info("GET /api/social/albums - Getting public albums - page: {}, size: {}, keyword: {}", page, size, keyword);
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
}