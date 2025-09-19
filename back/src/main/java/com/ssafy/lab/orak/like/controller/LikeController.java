package com.ssafy.lab.orak.like.controller;


import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.like.dto.LikeDto;
import com.ssafy.lab.orak.like.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/social/albums")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{albumId}/like")
    @Operation(summary = "앨범 좋아요", description = "특정 앨범에 좋아요를 추가합니다.")
    public ResponseEntity<Void> addLike(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        LikeDto.Request request = LikeDto.Request.builder()
                .albumId(albumId)
                .build();

        likeService.addLike(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{albumId}/like")
    @Operation(summary = "앨범 좋아요 취소", description = "특정 앨범의 좋아요를 취소합니다.")
    public ResponseEntity<Void> removeLike(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        likeService.removeLike(userId, albumId);

        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}

