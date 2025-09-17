package com.ssafy.lab.orak.album.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumUpdateRequestDto {

    @NotBlank
    @Size(max = 100, message = "앨범 제목은 100자 이하")
    private String title;

    @Size(max = 500, message = "설명은 500자 이하")
    private String description;

    private Long uploadId;

    private Boolean isPublic;
}