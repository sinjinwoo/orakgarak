package com.ssafy.lab.orak.albumtrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybackResponseDTO {
    
    private AlbumTrackResponseDTO currentTrack;
    private AlbumTrackResponseDTO nextTrack;
    private AlbumTrackResponseDTO previousTrack;
    private Boolean hasNext;
    private Boolean hasPrevious;
    private Integer totalTracks;
}