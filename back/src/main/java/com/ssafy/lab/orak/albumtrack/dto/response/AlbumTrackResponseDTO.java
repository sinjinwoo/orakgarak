package com.ssafy.lab.orak.albumtrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumTrackResponseDTO {
    
    private Long id;
    private Long albumId;
    private Long recordId;
    private String recordTitle;
    private Integer trackOrder;
    private Integer durationSeconds;
    private String audioUrl;
}