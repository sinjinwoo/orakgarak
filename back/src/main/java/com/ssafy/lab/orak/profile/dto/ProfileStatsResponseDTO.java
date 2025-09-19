package com.ssafy.lab.orak.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileStatsResponseDTO {
    private Long followerCount;
    private Long followingCount;
    private Long albumCount;
    private Long likedAlbumCount;

    public static ProfileStatsResponseDTO of(Long followerCount, Long followingCount, Long albumCount, Long likedAlbumCount) {
        return ProfileStatsResponseDTO.builder()
                .followerCount(followerCount)
                .followingCount(followingCount)
                .albumCount(albumCount)
                .likedAlbumCount(likedAlbumCount)
                .build();
    }
}