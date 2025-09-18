package com.ssafy.lab.orak.follow.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class FollowDto {

    @Getter
    @Builder
    public static class UserResponse {
        private Long userId;
        private String nickname;
        private String email;
        private LocalDateTime followedAt;
        private boolean isFollowingBack; // 맞팔로우 여부
    }
}
