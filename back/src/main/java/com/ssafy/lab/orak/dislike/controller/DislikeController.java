package com.ssafy.lab.orak.dislike.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.dislike.dto.DislikeDto;
import com.ssafy.lab.orak.dislike.service.DislikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/songs/dislikes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dislike", description = "싫어요 관리 API")
public class DislikeController {

    private final DislikeService dislikeService;

    @PostMapping("/toggle")
    @Operation(summary = "싫어요 토글", description = "싫어요를 추가하거나 제거합니다.")
    public ResponseEntity<Map<String, Object>> toggleDislike(
            @RequestBody DislikeDto.Request request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        boolean isDisliked = dislikeService.toggleDislike(userId, request.getSongId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isDisliked", isDisliked);
        response.put("message", isDisliked ? "싫어요를 추가했습니다." : "싫어요를 취소했습니다.");

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "싫어요 추가", description = "곡에 싫어요를 추가합니다.")
    public ResponseEntity<Map<String, Object>> addDislike(
            @RequestBody DislikeDto.Request request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        dislikeService.addDislike(userId, request.getSongId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "싫어요를 추가했습니다.");

        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @Operation(summary = "싫어요 제거", description = "곡의 싫어요를 제거합니다.")
    public ResponseEntity<Map<String, Object>> removeDislike(
            @RequestBody DislikeDto.Request request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        dislikeService.removeDislike(userId, request.getSongId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "싫어요를 취소했습니다.");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check")
    @Operation(summary = "싫어요 여부 확인", description = "특정 곡에 대한 사용자의 싫어요 여부를 확인합니다.")
    public ResponseEntity<Map<String, Object>> checkDislike(
            @Parameter(description = "곡 ID") @RequestParam Long songId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        boolean isDisliked = dislikeService.isDisliked(userId, songId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isDisliked", isDisliked);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user")
    @Operation(summary = "내 싫어요 목록", description = "로그인한 사용자가 싫어요한 곡 ID 목록을 조회합니다.")
    public ResponseEntity<Map<String, Object>> getMyDislikedSongs(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        List<Long> dislikedSongIds = dislikeService.getUserDislikedSongIds(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("dislikedSongIds", dislikedSongIds);
        response.put("count", dislikedSongIds.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count/{songId}")
    @Operation(summary = "곡 싫어요 수", description = "특정 곡의 총 싫어요 수를 조회합니다.")
    public ResponseEntity<Map<String, Object>> getDislikeCount(
            @Parameter(description = "곡 ID") @PathVariable Long songId) {

        long count = dislikeService.getDislikeCount(songId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", count);

        return ResponseEntity.ok(response);
    }
}