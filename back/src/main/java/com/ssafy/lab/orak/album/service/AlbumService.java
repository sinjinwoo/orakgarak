package com.ssafy.lab.orak.album.service;

import com.ssafy.lab.orak.album.dto.AlbumCreateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumUpdateRequestDto;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.exception.AlbumAccessDeniedException;
import com.ssafy.lab.orak.album.exception.AlbumNotFoundException;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.service.ProfileService;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final FileUploadService fileUploadService;
    private final ProfileService profileService;

    // =========================
    // 앨범 생성
    // =========================
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

        return convertToResponseDto(savedAlbum);
    }

    // =========================
    // 전체 앨범 목록 조회 (페이지네이션)
    // =========================
    @Transactional(readOnly = true)
    public Page<AlbumResponseDto> getAllAlbums(int page, int size) {
        log.info("getAllAlbums - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Album> albums = albumRepository.findAllByOrderByCreatedAtDesc(pageable);
        // ✅ 각 아이템을 convertToResponseDto로 변환 (coverImageUrl 포함)
        return albums.map(this::convertToResponseDto);
    }

    // =========================
    // 앨범 상세 조회
    // =========================
    @Transactional(readOnly = true)
    public AlbumResponseDto getAlbum(Long albumId, Long currentUserId) {
        log.info("getAlbum: {}, by user: {}", albumId, currentUserId);

        Album album = findAlbumById(albumId);

        if (currentUserId != null && !album.canBeAccessedBy(currentUserId)) {
            throw new AlbumAccessDeniedException("앨범에 접근할 권한이 없습니다.");
        }

        return convertToResponseDto(album);
    }

    // =========================
    // 앨범 수정
    // =========================
    public AlbumResponseDto updateAlbum(Long userId, Long albumId, AlbumUpdateRequestDto request) {
        log.info("update album: {}, by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

        // 필드별 업데이트
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

        return convertToResponseDto(updatedAlbum);
    }

    // =========================
    // 앨범 삭제
    // =========================
    public void deleteAlbum(Long albumId, Long userId) {
        log.info("Deleting album: {} by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

        if (!album.isOwnedBy(userId)) {
            throw new AlbumAccessDeniedException("앨범을 삭제할 권한이 없습니다.");
        }

        albumRepository.delete(album);
        log.info("Album deleted successfully: {}", albumId);
    }

    // =========================
    // 앨범 커버 이미지 업로드
    // =========================
    public AlbumResponseDto uploadCoverImage(Long albumId, MultipartFile imageFile, Long userId) {
        log.info("uploadCoverImage - albumId: {}, by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

        // 이전 커버 이미지가 있으면 삭제
        if (album.getUploadId() != null) {
            try {
                fileUploadService.deleteFile(album.getUploadId());
                log.info("Previous cover image deleted: uploadId = {}", album.getUploadId());
            } catch (Exception e) {
                log.warn("Failed to delete previous cover image: uploadId = {}", album.getUploadId(), e);
            }
        }

        // 새 커버 이미지 업로드
        Upload upload = fileUploadService.uploadSingleFile(imageFile, "album-covers", userId);

        // 앨범 업데이트
        album.setUploadId(upload.getId());
        Album updatedAlbum = albumRepository.save(album);

        log.info("Cover image uploaded successfully: albumId = {}, uploadId = {}", albumId, upload.getId());
        return convertToResponseDto(updatedAlbum);
    }

    // =========================
    // 앨범 커버 이미지 삭제
    // =========================
    public AlbumResponseDto removeCoverImage(Long albumId, Long userId) {
        log.info("removeCoverImage - albumId: {}, by user: {}", albumId, userId);

        Album album = findAlbumByIdAndUserId(albumId, userId);

        if (album.getUploadId() != null) {
            try {
                fileUploadService.deleteFile(album.getUploadId());
                log.info("Cover image deleted: uploadId = {}", album.getUploadId());
            } catch (Exception e) {
                log.warn("Failed to delete cover image: uploadId = {}", album.getUploadId(), e);
            }

            album.setUploadId(null);
            Album updatedAlbum = albumRepository.save(album);

            log.info("Cover image removed successfully: albumId = {}", albumId);
            return convertToResponseDto(updatedAlbum);
        }

        return convertToResponseDto(album);
    }

    // =========================
    // 공개 앨범 목록 조회 (검색 포함, 페이지네이션)
    // =========================
    @Transactional(readOnly = true)
    public Page<AlbumResponseDto> getPublicAlbums(int page, int size, String keyword) {
        log.info("getPublicAlbums - page: {}, size: {}, keyword: {}", page, size, keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<Album> albums;

        if (keyword != null && !keyword.trim().isEmpty()) {
            albums = albumRepository.findPublicAlbumsByKeyword(keyword.trim(), pageable);
        } else {
            albums = albumRepository.findByIsPublicTrueOrderByCreatedAtDesc(pageable);
        }

        // ✅ from(...) 대신 convertToResponseDto 사용 (cover URL 포함)
        return albums.map(this::convertToResponseDto);
    }

    // =========================
    // 공개 앨범 상세 조회
    // =========================
    @Transactional(readOnly = true)
    public AlbumResponseDto getPublicAlbum(Long albumId) {
        log.info("getPublicAlbum: {}", albumId);

        Album album = findAlbumById(albumId);

        if (!album.getIsPublic()) {
            throw new AlbumAccessDeniedException("비공개 앨범입니다.");
        }

        // ✅ from(...) 대신 convertToResponseDto 사용
        return convertToResponseDto(album);
    }

    // =========================
    // 팔로우한 사용자의 공개 앨범 목록 (페이지네이션 + 검색)
    // =========================
    @Transactional(readOnly = true)
    public Page<AlbumResponseDto> getFollowedUsersPublicAlbums(Long currentUserId, int page, int size, String keyword) {
        log.info("getFollowedUsersPublicAlbums - currentUserId: {}, page: {}, size: {}, keyword: {}",
                currentUserId, page, size, keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<Album> albums;

        if (keyword != null && !keyword.trim().isEmpty()) {
            albums = albumRepository.findPublicAlbumsByFollowedUsersAndKeyword(currentUserId, keyword.trim(), pageable);
        } else {
            albums = albumRepository.findPublicAlbumsByFollowedUsers(currentUserId, pageable);
        }

        // ✅ 항상 convertToResponseDto로 매핑
        return albums.map(this::convertToResponseDto);
    }

    // =========================
    // 공용 변환 (uploadId → coverImageUrl + 사용자 정보)
    // =========================
    private AlbumResponseDto convertToResponseDto(Album album) {
        String coverImageUrl;
        if (album.getUploadId() != null) {
            try {
                coverImageUrl = fileUploadService.getFileUrl(album.getUploadId());
            } catch (Exception e) {
                log.warn("Failed to generate cover image URL for uploadId: {}", album.getUploadId(), e);
                coverImageUrl = getDefaultCoverImageUrl();
            }
        } else {
            coverImageUrl = getDefaultCoverImageUrl();
        }

        // 사용자 프로필 정보 가져오기
        String userNickname = "알 수 없는 사용자";
        String userProfileImageUrl = null;
        try {
            ProfileResponseDTO profile = profileService.getProfileByUserId(album.getUserId());
            if (profile != null) {
                userNickname = profile.getNickname() != null ? profile.getNickname() : "사용자 " + album.getUserId();
                userProfileImageUrl = profile.getProfileImageUrl();
            }
        } catch (Exception e) {
            log.warn("Failed to get profile for userId: {}", album.getUserId(), e);
            userNickname = "사용자 " + album.getUserId();
        }

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

    // 기본 커버 이미지 URL (프론트 폴백과 경로를 맞추고 싶으면 여기서 통일)
    private String getDefaultCoverImageUrl() {
        return "/image/albumCoverImage.png";
        // return "/images/default-album-cover.png"; // 프론트 폴백과 통일하고 싶으면 이 줄로
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
