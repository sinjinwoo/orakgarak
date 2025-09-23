package com.ssafy.lab.orak.album.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ssafy.lab.orak.album.entity.Album;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumResponseDto {
    
    private Long id;

    private Long userId;

    private String title;

    private String description;

    private Long uploadId;
    
    private String coverImageUrl;

    private Boolean isPublic;

    private Integer trackCount;

    private Integer totalDuration;

    private Integer likeCount;

    // 사용자 정보 필드 추가
    private String userNickname;

    private String userProfileImageUrl;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    public static AlbumResponseDto from(Album album, String coverImageUrl, String userNickname, String userProfileImageUrl) {
        return AlbumResponseDto.builder()
                .id(album.getId())
                .userId(album.getUserId())
                .title(album.getTitle())
                .description(album.getDescription())
                .uploadId(album.getUploadId())
                .coverImageUrl(coverImageUrl)
                .userNickname(userNickname)
                .userProfileImageUrl(userProfileImageUrl)
                .isPublic(album.getIsPublic())
                .trackCount(album.getTrackCount())
                .totalDuration(album.getTotalDuration())
                .likeCount(album.getLikeCount())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .build();
    }
}