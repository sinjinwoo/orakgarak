package com.ssafy.lab.orak.song.dto;

import com.ssafy.lab.orak.song.entity.Song;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongResponseDTO {

    private Long id;
    private Long songId;
    private String songName;
    private String artistName;
    private String albumName;
    private String musicUrl;
    private String lyrics;
    private String albumCoverUrl;
    private String spotifyTrackId;
    private Integer durationMs;
    private Integer popularity;
    private String status;

    public static SongResponseDTO from(Song song) {
        return SongResponseDTO.builder()
                .id(song.getId())
                .songId(song.getSongId())
                .songName(song.getSongName())
                .artistName(song.getArtistName())
                .albumName(song.getAlbumName())
                .musicUrl(song.getMusicUrl())
                .lyrics(song.getLyrics())
                .albumCoverUrl(song.getAlbumCoverUrl())
                .spotifyTrackId(song.getSpotifyTrackId())
                .durationMs(song.getDurationMs())
                .popularity(song.getPopularity())
                .status(song.getStatus())
                .build();
    }
}