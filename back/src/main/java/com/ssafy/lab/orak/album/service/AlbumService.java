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
    public AlbumResponseDto getAlbum(Long albumId, long currentUserId) {
        log.info("getAlbum: {}, by user: {}", albumId, currentUserId);

        Album album = findAlbumById(albumId);

        if (!album.canBeAccesseBy(currentUserId)) {
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
        return albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new AlbumAccessDeniedException("앨범에 접근할 권한이 없거나 앨범을 찾을 수 없습니다."));
    }
}

////    인기 앨범 조회
//@Transactional(readOnly = true)
//public Page<AlbumResponseDto> getPopularAlbums(int page, int size) {
//    log.info("getPopularAlbums by page: {}, size: {}", page, size);
//
//    Pageable pageable = PageRequest.of(page, size);
//    return albumRepository.findByIsPublicTrueOrderByLikeCountDescCreatedAtDesc(pageable)
//            .map(AlbumResponseDto::from);
//}
//
////    앨범 검색
//@Transactional(readOnly = true)
//public Page<AlbumResponseDto> searchAlbums(String keyword, int page, int size) {
//    log.info("searchAlbums by keyword: {}, page: {}, size: {}", keyword, page, size);
//
//    Pageable pageable = PageRequest.of(page, size);
//    return albumRepository.searchPublicAlbumsByTitle(keyword, pageable).map(AlbumResponseDto::from);
//}
//
//
////    앨범 좋아요
//public void likeAlbum(Long albumId, Long userId) {
//    log.info("likeAlbum: {}, userId: {}", albumId, userId);
//
//    Album album = findAlbumById(albumId);
//
//    if (!Boolean.TRUE.equals(album.getIsPublic())) {
//        throw new AlbumAccessDeniedException("비공개 앨범에는 좋아요를 누를 수 없습니다.");
//    }
//    albumRepository.incrementLikeCount(albumId);
//    log.info("Album {} liked successfully", albumId);
//}
////    앨범 좋아요 취소
//public void unlikeAlbum(Long albumId, Long userId) {
//    log.info("unlikeAlbum: {}, userId: {}", albumId, userId);
//
//    Album album = findAlbumById(albumId);
//    if (!Boolean.TRUE.equals(album.getIsPublic())) {
//        throw new AlbumAccessDeniedException("비공개 앨범에는 좋아요 취소를 누를 수 없습니다.");
//    }
//
//    albumRepository.decrementLikeCount(albumId);
//    log.info("Album {} unliked successfully", albumId);
//}
