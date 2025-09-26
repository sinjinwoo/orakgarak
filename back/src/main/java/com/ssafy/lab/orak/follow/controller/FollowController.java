package com.ssafy.lab.orak.follow.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.follow.dto.FollowDto;
import com.ssafy.lab.orak.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/social")
@RequiredArgsConstructor
@Tag(name = "Follow", description = "팔로우 관리 API")
public class FollowController {

    private final FollowService followService;

    @PostMapping("/follow/{userId}/toggle")
    @Operation(summary = "팔로우 토글", description = "팔로우를 추가하거나 제거합니다.")
    public ResponseEntity<Map<String, Object>> toggleFollow(
            @Parameter(description = "대상 사용자 ID") @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long loginUserId = principal.getUserId();
        boolean isFollowing = followService.toggleFollow(loginUserId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isFollowing", isFollowing);
        response.put("message", isFollowing ? "팔로우했습니다." : "언팔로우했습니다.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/follow/{userId}")
    @Operation(summary = "사용자 팔로우", description = "특정 사용자를 팔로우합니다.")
    public ResponseEntity<Void> followUser(
            @Parameter(description = "팔로우할 사용자 ID") @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        Long loginUserId = principal.getUserId();
        followService.followUser(loginUserId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/follow/{userId}")
    @Operation(summary = "사용자 언팔로우", description = "특정 사용자를 언팔로우합니다.")
    public ResponseEntity<Void> unfollowUser(
            @Parameter(description = "언팔로우할 사용자 ID") @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        Long loginUserId = principal.getUserId();
        followService.unfollowUser(loginUserId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/following/{userId}")
    @Operation(summary = "팔로잉 목록 조회", description = "특정 사용자가 팔로우하는 사용자 목록을 조회합니다.")
    public ResponseEntity<Page<FollowDto.UserResponse>> getFollowing(
            @Parameter(description = "사용자 ID") @PathVariable Long userId,
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FollowDto.UserResponse> following = followService.getFollowing(userId, pageable);
        return ResponseEntity.ok(following);
    }


    @GetMapping("/followers/{userId}")
    @Operation(summary = "팔로워 목록 조회", description = "특정 사용자를 팔로우하는 사용자 목록을 조회합니다.")
    public ResponseEntity<Page<FollowDto.UserResponse>> getFollowers(
            @Parameter(description = "사용자 ID") @PathVariable Long userId,
            @RequestParam(defaultValue = "0") @Parameter(description = "페이지 번호") int page,
            @RequestParam(defaultValue = "20") @Parameter(description = "페이지 크기") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FollowDto.UserResponse> followers = followService.getFollowers(userId, pageable);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/follow/{userId}/check")
    @Operation(summary = "팔로우 여부 확인", description = "특정 사용자에 대한 팔로우 여부를 확인합니다.")
    public ResponseEntity<Map<String, Object>> checkFollow(
            @Parameter(description = "대상 사용자 ID") @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long loginUserId = principal.getUserId();
        boolean isFollowing = followService.isFollowing(loginUserId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isFollowing", isFollowing);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/follow/{userId}/count")
    @Operation(summary = "팔로우 수 조회", description = "특정 사용자의 팔로워/팔로잉 수를 조회합니다.")
    public ResponseEntity<Map<String, Object>> getFollowCount(
            @Parameter(description = "사용자 ID") @PathVariable Long userId) {

        long followerCount = followService.getFollowerCount(userId);
        long followingCount = followService.getFollowingCount(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("followerCount", followerCount);
        response.put("followingCount", followingCount);

        return ResponseEntity.ok(response);
    }
}