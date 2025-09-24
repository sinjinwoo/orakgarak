package com.ssafy.lab.orak.ai.dto;

import com.ssafy.lab.orak.song.entity.Song;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationSongDto {

    private Long id;
    private Long songId;
    private String songName;
    private String artistName;
    private String albumCoverUrl;

    public static RecommendationSongDto from(Song song) {
        return RecommendationSongDto.builder()
                .id(song.getId())
                .songId(song.getSongId())
                .songName(song.getSongName())
                .artistName(song.getArtistName())
                .albumCoverUrl(song.getAlbumCoverUrl())
                .build();
    }
}