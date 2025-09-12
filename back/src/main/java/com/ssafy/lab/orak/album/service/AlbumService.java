package com.ssafy.lab.orak.album.service;

import com.ssafy.lab.orak.album.dto.AlbumCreateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumUpdateRequestDto;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.exception.AlbumAccessDeniedException;
import com.ssafy.lab.orak.album.exception.AlbumNotFoundException;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AlbumService {
    
    private final AlbumRepository albumRepository;

//    앨범 생성

    public AlbumResponseDto createAlbum(Long userId, AlbumCreateRequestDto request) {
        log.info("create album for user: {}, title: {}", userId, request.getTitle());

        Album album = Album.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .uploadId(request.getUploadId())
                .isPublic(request.getIsPublic())
                .build();

        Album savedAlbum = albumRepository.save(album);
        log.info("Album created successfully with ID: {}", savedAlbum.getId());

        return AlbumResponseDto.from(savedAlbum);
    }

//    전체 앨범 목록 조회
    @Transactional(readOnly = true)
    public Page<AlbumResponseDto> getAllAlbums(int page, int size) {
        log.info("getAllAlbums - page: {}, size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size);
        return albumRepository.findAllByOrderByCreatedAtDesc(pageable).map(AlbumResponseDto::from);
    }

//    앨범 상세 목록 조회 (페이징)
    @Transactional(readOnly = true)
    public AlbumResponseDto getAlbum(Long albumId, Long currentUserId) {
        log.info("getAlbum: {}, by user: {}", albumId, currentUserId);

        Album album = findAlbumById(albumId);

        if (currentUserId != null && !album.canBeAccessedBy(currentUserId)) {
            throw new AlbumAccessDeniedException("앨범에 접근할 권한이 없습니다.");
        }

        return AlbumResponseDto.from(album);
    }

//    앨범 수정
    public AlbumResponseDto updateAlbum(Long userId, Long albumId, AlbumUpdateRequestDto request) {
        log.info("update album: {}, by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

//        필드별 업데이트
        if (request.getTitle() != null) {
            album.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            album.setDescription(request.getDescription());
        }
        if (request.getUploadId() != null) {
            album.setUploadId(request.getUploadId());
        }
        if (request.getIsPublic() != null) {
            album.setIsPublic(request.getIsPublic());
        }

        Album updatedAlbum = albumRepository.save(album);
        log.info("Album updated successfully with ID: {}", albumId);

        return AlbumResponseDto.from(updatedAlbum);
    }

//    앨범 삭제
    public void deleteAlbum(Long albumId, Long userId) {
        log.info("Deleting album: {} by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

        if (!album.isOwnedBy(userId)) {
            throw new AlbumAccessDeniedException("앨범을 삭제할 권한이 없습니다.");
        }

        albumRepository.delete(album);
        log.info("Album deleted successfully: {}", albumId);
    }


    private Album findAlbumById(Long albumId) {
        return albumRepository.findById(albumId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));
    }

    private Album findAlbumByIdAndUserId(Long albumId, Long userId) {
        Album album = findAlbumById(albumId);
        if (!album.isOwnedBy(userId)) {
            throw new AlbumAccessDeniedException("앨범에 접근할 권한이 없거나 앨범을 찾을 수 없습니다.");
        }
        return album;
    }
}

