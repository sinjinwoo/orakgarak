package com.ssafy.lab.orak.album.service;

import com.ssafy.lab.orak.album.dto.AlbumCreateRequestDto;
import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.dto.AlbumUpdateRequestDto;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.exception.AlbumAccessDeniedException;
import com.ssafy.lab.orak.album.exception.AlbumNotFoundException;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.albumtrack.service.AlbumTrackService;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.service.ProfileService;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Log4j2
@Service
@Transactional
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final FileUploadService fileUploadService;
    private final ProfileService profileService;
    private final AlbumTrackService albumTrackService;

    // =========================
    // 앨범 생성 (트랙과 함께 생성 가능)
    // =========================
    public AlbumResponseDto createAlbum(Long userId, AlbumCreateRequestDto request) {
        log.info("앨범 생성 요청 - 사용자: {}, 제목: {}, 트랙 개수: {}",
            userId, request.getTitle(), request.getRecordIds() != null ? request.getRecordIds().size() : 0);

        try {
            // 요청 데이터 검증
            log.debug("요청 데이터 검증 시작");
            validateAlbumCreateRequest(request);
            log.debug("요청 데이터 검증 완료");

            // 앨범 엔티티 생성 및 저장
            log.debug("앨범 엔티티 생성 시작");
            Album album = Album.builder()
                    .userId(userId)
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .uploadId(request.getUploadId())
                    .isPublic(request.getIsPublic())
                    .build();

            log.debug("앨범 저장 시작");
            Album savedAlbum = albumRepository.save(album);
            log.debug("앨범 저장 완료 - 앨범ID: {}", savedAlbum.getId());

            // 트랙 데이터가 있으면 트랙들도 함께 생성
            if (hasTrackData(request)) {
                log.info("앨범과 함께 트랙 생성 시작 - 앨범ID: {}, 트랙 개수: {}",
                    savedAlbum.getId(), request.getRecordIds().size());

                albumTrackService.createAlbumTracksOnAlbumCreation(
                    savedAlbum,
                    request.getRecordIds(),
                    request.getTrackOrders(),
                    userId
                );
                log.info("앨범과 트랙 생성 완료 - 앨범ID: {}, 트랙 개수: {}",
                    savedAlbum.getId(), request.getRecordIds().size());
            } else {
                log.info("트랙 없는 앨범 생성 완료 - 앨범ID: {}", savedAlbum.getId());
            }

            // 트랙 생성 시 통계가 업데이트되므로 savedAlbum 정보 사용
            log.debug("응답 DTO 생성 시작");
            return convertToResponseDto(savedAlbum);
        } catch (Exception e) {
            log.error("앨범 생성 중 오류 발생 - 사용자: {}, 제목: {}", userId, request.getTitle(), e);
            throw e;
        }
    }

    // =========================
    // 전체 앨범 목록 조회 (페이지네이션)
    // =========================
    @Transactional(readOnly = true)
    public Page<AlbumResponseDto> getAllAlbums(int page, int size) {
        log.info("전체 앨범 조회 - 페이지: {}, 크기: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Album> albums = albumRepository.findAllByOrderByCreatedAtDesc(pageable);
        // 각 아이템을 convertToResponseDto로 변환 (coverImageUrl 포함)
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
        String userNickname = "사용자 " + album.getUserId();
        String userProfileImageUrl = null;

        try {
            ProfileResponseDTO profile = profileService.getProfileByUserId(album.getUserId());
            if (profile != null) {
                userNickname = profile.getNickname() != null ? profile.getNickname() : userNickname;
                userProfileImageUrl = profile.getProfileImageUrl();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch profile for userId: {}", album.getUserId(), e);
        }

        log.debug("사용자 정보 - userId: {}, nickname: {}, profileImageUrl: {}",
                  album.getUserId(), userNickname, userProfileImageUrl);

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

    // === Helper Methods for Album Creation ===

    private void validateAlbumCreateRequest(AlbumCreateRequestDto request) {
        if (!request.hasValidTrackData()) {
            throw new IllegalArgumentException(
                "녹음본이 선택되었다면 트랙 순서도 함께 제공되어야 하며, 개수가 일치해야 합니다.");
        }
    }

    private boolean hasTrackData(AlbumCreateRequestDto request) {
        return request.getRecordIds() != null &&
               !request.getRecordIds().isEmpty() &&
               request.getTrackOrders() != null &&
               !request.getTrackOrders().isEmpty();
    }
}
