package com.ssafy.lab.orak.like.controller;


import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.like.dto.LikeDto;
import com.ssafy.lab.orak.like.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/social/albums")
@RequiredArgsConstructor
@Tag(name = "Like", description = "좋아요 관리 API")
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{albumId}/like/toggle")
    @Operation(summary = "앨범 좋아요 토글", description = "앨범 좋아요를 추가하거나 제거합니다.")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        boolean isLiked = likeService.toggleLike(userId, albumId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isLiked", isLiked);
        response.put("message", isLiked ? "좋아요를 추가했습니다." : "좋아요를 취소했습니다.");

        return ResponseEntity.ok(response);
    }

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

    @GetMapping("/{albumId}/like/check")
    @Operation(summary = "좋아요 여부 확인", description = "특정 앨범에 대한 사용자의 좋아요 여부를 확인합니다.")
    public ResponseEntity<Map<String, Object>> checkLike(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        boolean isLiked = likeService.isLiked(userId, albumId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isLiked", isLiked);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{albumId}/like/count")
    @Operation(summary = "앨범 좋아요 수", description = "특정 앨범의 총 좋아요 수를 조회합니다.")
    public ResponseEntity<Map<String, Object>> getLikeCount(
            @PathVariable @Parameter(description = "앨범 ID") Long albumId) {

        long count = likeService.getLikeCount(albumId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", count);

        return ResponseEntity.ok(response);
    }
}

