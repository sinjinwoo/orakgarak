package com.ssafy.lab.orak.album.controller;

import com.ssafy.lab.orak.album.dto.AlbumCreateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumUpdateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumCoverUploadResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumCoverGenerateRequestDto;
import com.ssafy.lab.orak.album.service.AlbumService;
import com.ssafy.lab.orak.album.service.AlbumCoverService;
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
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;


@Slf4j
@RestController
@RequestMapping("/albums")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlbumController {

    private final AlbumService albumService;
    private final AlbumCoverService albumCoverService;

    //    앨범 생성
    @PostMapping
    @Operation(summary = "앨범 생성", description = "새로운 앨범을 생성합니다.")
    public ResponseEntity<AlbumResponseDto> createAlbum(
            @RequestBody @Valid AlbumCreateRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        try {
            Long userId = principal.getUserId();
            log.info("앨범 생성 컨트롤러 호출 - 사용자ID: {}, 요청: {}", userId, request);
            AlbumResponseDto response = albumService.createAlbum(userId, request);
            log.info("앨범 생성 성공 - 앨범ID: {}", response.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("앨범 생성 컨트롤러에서 오류 발생", e);
            throw e;
        }
    }


    //    전체 앨범 조회
    @GetMapping
    @Operation(summary = "앨범 조회", description = "전체 앨범을 조회합니다.")
    public ResponseEntity<Page<AlbumResponseDto>> getAllAlbums(
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size) {

        log.info("전체 앨범 조회 요청 - 페이지: {}, 크기: {}", page, size);
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
        log.info("앨범 상세 조회 요청 - 앨범ID: {}, 사용자ID: {}", albumId, userId);
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
        log.info("앨범 수정 요청 - 앨범ID: {}, 사용자ID: {}", albumId, userId);
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
        log.info("앨범 삭제 요청 - 앨범ID: {}, 사용자ID: {}", albumId, userId);
        albumService.deleteAlbum(albumId, userId);
        return ResponseEntity.noContent().build();
    }

    // 앨범 커버 직접 업로드 (앨범 생성 전)
    @PostMapping("/covers/upload")
    @Operation(summary = "앨범 커버 업로드", description = "사용자가 직접 앨범 커버 이미지를 업로드합니다. (앨범 생성 전)")
    public ResponseEntity<AlbumCoverUploadResponseDto> uploadAlbumCover(
            @RequestParam("file") @Parameter(description = "업로드할 이미지 파일") MultipartFile file,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("앨범 커버 업로드 요청 - 사용자ID: {}", userId);

        AlbumCoverUploadResponseDto response = albumCoverService.uploadAlbumCover(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // AI 앨범 커버 생성 (앨범 생성 전)
    @PostMapping("/covers/generate")
    @Operation(summary = "AI 앨범 커버 생성", description = "녹음 데이터를 기반으로 AI가 앨범 커버를 생성합니다. (앨범 생성 전)")
    public ResponseEntity<AlbumCoverUploadResponseDto> generateAlbumCover(
            @RequestBody @Valid AlbumCoverGenerateRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("AI 앨범 커버 생성 요청 - 사용자ID: {}, 업로드ID들: {}", userId, request.uploadIds());

        try {
            AlbumCoverUploadResponseDto response = albumCoverService.generateAlbumCover(userId, request).block();
            log.info("AI 앨범 커버 생성 완료 - 사용자ID: {}", userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception error) {
            log.error("AI 앨범 커버 생성 실패 - 사용자ID: {}", userId, error);
            throw new RuntimeException("앨범 커버 생성 중 오류가 발생했습니다: " + error.getMessage(), error);
        }
    }
}

