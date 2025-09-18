package com.ssafy.lab.orak.albumtrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumTracksResponseDTO {
    
    private Long albumId;
    private String albumTitle;
    private String coverImageUrl;
    private Integer totalTracks;
    private Integer totalDuration;
    private List<AlbumTrackResponseDTO> tracks;
}