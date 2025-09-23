package com.ssafy.lab.orak.profile.dto;

import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LikedAlbumsResponseDTO {
    private List<AlbumResponseDto> likedAlbums;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    public static LikedAlbumsResponseDTO from(Page<AlbumResponseDto> albumPage) {
        return LikedAlbumsResponseDTO.builder()
                .likedAlbums(albumPage.getContent())
                .currentPage(albumPage.getNumber())
                .totalPages(albumPage.getTotalPages())
                .totalElements(albumPage.getTotalElements())
                .hasNext(albumPage.hasNext())
                .hasPrevious(albumPage.hasPrevious())
                .build();
    }
}