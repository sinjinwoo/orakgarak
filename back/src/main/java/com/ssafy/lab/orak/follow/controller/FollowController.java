package com.ssafy.lab.orak.follow.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.follow.dto.FollowDto;
import com.ssafy.lab.orak.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/social")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

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
}