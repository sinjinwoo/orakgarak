package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.album.dto.AlbumResponseDto;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.UserService;
import com.ssafy.lab.orak.follow.repository.FollowRepository;
import com.ssafy.lab.orak.like.repository.LikeRepository;
import com.ssafy.lab.orak.profile.dto.LikedAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileStatsResponseDTO;
import com.ssafy.lab.orak.profile.dto.UserAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.exception.ProfileNotFoundException;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;
    private final ProfileImageService profileImageService;
    private final FollowRepository followRepository;
    private final AlbumRepository albumRepository;
    private final LikeRepository likeRepository;
    private final FileUploadService fileUploadService;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDTO getMyProfile(Long userId) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseThrow(
                        () -> new ProfileNotFoundException("프로필을 찾을 수 없습니다: userId=" + userId));
        return toResponseDTO(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDTO getProfileByUserId(Long userId) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseThrow(
                        () -> new ProfileNotFoundException("프로필을 찾을 수 없습니다: userId=" + userId));
        return toResponseDTO(profile);
    }

    @Override
    @Transactional
    public ProfileResponseDTO upsertMyProfile(Long userId, ProfileRequestDTO request) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    User user = userService.findById(userId);
                    return Profile.builder()
                            .user(user)
                            .build();
                });

        // Use domain update method instead of exposing setters
        profile.update(null, request.getNickname(), request.getGender(), request.getDescription());

        Profile saved = profileRepository.save(profile);
        log.info("프로필 upsert 완료 - userId: {} profileId: {}", userId, saved.getId());
        return toResponseDTO(saved);
    }

    @Override
    @Transactional
    public ProfileResponseDTO updateProfileWithImage(Long userId, MultipartFile imageFile, String nickname, String gender, String description) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    User user = userService.findById(userId);
                    return Profile.builder()
                            .user(user)
                            .build();
                });

        // 기존 이미지 Upload 백업
        Upload oldImageUpload = profile.getProfileImageUpload();

        try {
            // 1. 새 이미지 먼저 업로드
            Upload newImageUpload = profileImageService.uploadProfileImage(imageFile, userId);

            // 2. 프로필 업데이트 (DB 트랜잭션 내에서)
            profile.update(newImageUpload, nickname, gender, description);
            Profile saved = profileRepository.save(profile);

            // 3. 성공 시에만 기존 이미지 삭제 (트랜잭션 커밋 후)
            if (oldImageUpload != null && !oldImageUpload.getId().equals(newImageUpload.getId())) {
                try {
                    profileImageService.deleteProfileImage(oldImageUpload);
                } catch (Exception e) {
                    // 기존 이미지 삭제 실패는 로그만 남기고 진행 (새 이미지는 이미 성공적으로 업로드됨)
                    log.warn("기존 프로필 이미지 삭제 실패 (데이터 일관성은 유지됨) - userId: {}, oldUploadId: {}", userId, oldImageUpload.getId(), e);
                }
            }

            log.info("프로필 이미지 업로드 및 업데이트 완료 - userId: {} profileId: {}", userId, saved.getId());
            return toResponseDTO(saved);

        } catch (Exception e) {
            // 새 이미지 업로드나 DB 업데이트 실패 시 기존 상태 유지
            log.error("프로필 이미지 업데이트 실패 - userId: {}", userId, e);
            throw new RuntimeException("프로필 이미지 업데이트 실패: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ProfileResponseDTO updateBackgroundImage(Long userId, MultipartFile imageFile) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    User user = userService.findById(userId);
                    return Profile.builder()
                            .user(user)
                            .build();
                });

        // 기존 백그라운드 이미지 Upload 백업
        Upload oldBackgroundUpload = profile.getBackgroundImageUpload();

        try {
            // 1. 새 백그라운드 이미지 먼저 업로드
            Upload newBackgroundUpload = profileImageService.uploadProfileImage(imageFile, userId);

            // 2. 프로필 업데이트 (DB 트랜잭션 내에서)
            profile.updateBackgroundImage(newBackgroundUpload);
            Profile saved = profileRepository.save(profile);

            // 3. 성공 시에만 기존 백그라운드 이미지 삭제 (트랜잭션 커밋 후)
            if (oldBackgroundUpload != null && !oldBackgroundUpload.getId().equals(newBackgroundUpload.getId())) {
                try {
                    profileImageService.deleteProfileImage(oldBackgroundUpload);
                } catch (Exception e) {
                    // 기존 이미지 삭제 실패는 로그만 남기고 진행 (새 이미지는 이미 성공적으로 업로드됨)
                    log.warn("기존 백그라운드 이미지 삭제 실패 (데이터 일관성은 유지됨) - userId: {}, oldUploadId: {}", userId, oldBackgroundUpload.getId(), e);
                }
            }

            log.info("백그라운드 이미지 업로드 및 업데이트 완료 - userId: {} profileId: {}", userId, saved.getId());
            return toResponseDTO(saved);

        } catch (Exception e) {
            // 새 이미지 업로드나 DB 업데이트 실패 시 기존 상태 유지
            log.error("백그라운드 이미지 업데이트 실패 - userId: {}", userId, e);
            throw new RuntimeException("백그라운드 이미지 업데이트 실패: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ProfileResponseDTO removeBackgroundImage(Long userId) {
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ProfileNotFoundException("프로필을 찾을 수 없습니다: userId=" + userId));

        Upload backgroundUpload = profile.getBackgroundImageUpload();

        try {
            // 1. 프로필에서 백그라운드 이미지 참조 제거
            profile.updateBackgroundImage(null);
            Profile saved = profileRepository.save(profile);

            // 2. 성공 시에만 기존 백그라운드 이미지 삭제
            if (backgroundUpload != null) {
                try {
                    profileImageService.deleteProfileImage(backgroundUpload);
                } catch (Exception e) {
                    // 이미지 삭제 실패는 로그만 남기고 진행 (프로필은 이미 성공적으로 업데이트됨)
                    log.warn("백그라운드 이미지 삭제 실패 (프로필 참조는 제거됨) - userId: {}, uploadId: {}", userId, backgroundUpload.getId(), e);
                }
            }

            log.info("백그라운드 이미지 제거 완료 - userId: {} profileId: {}", userId, saved.getId());
            return toResponseDTO(saved);

        } catch (Exception e) {
            log.error("백그라운드 이미지 제거 실패 - userId: {}", userId, e);
            throw new RuntimeException("백그라운드 이미지 제거 실패: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return false;
        }
        return !profileRepository.existsByNickname(nickname);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileStatsResponseDTO getMyPageStats(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 null일 수 없습니다");
        }

        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ProfileNotFoundException("프로필을 찾을 수 없습니다: userId=" + userId));

        Long followerCount = followRepository.countByFollowing(profile);
        Long followingCount = followRepository.countByFollower(profile);
        Long albumCount = albumRepository.countByUserId(userId);
        Long likedAlbumCount = likeRepository.countByUserId(userId);

        // Null 값을 0으로 처리
        followerCount = followerCount != null ? followerCount : 0L;
        followingCount = followingCount != null ? followingCount : 0L;
        albumCount = albumCount != null ? albumCount : 0L;
        likedAlbumCount = likedAlbumCount != null ? likedAlbumCount : 0L;

        return ProfileStatsResponseDTO.of(followerCount, followingCount, albumCount, likedAlbumCount);
    }

    @Override
    @Transactional(readOnly = true)
    public LikedAlbumsResponseDTO getLikedAlbums(Long userId, Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Album> likedAlbums = likeRepository.findLikedAlbumsByUserId(userId, sortedPageable);
        Page<AlbumResponseDto> albumDtos = likedAlbums.map(album -> {
            String coverImageUrl;
            if (album.getUploadId() != null) {
                try {
                    coverImageUrl = fileUploadService.getFileUrl(album.getUploadId());
                } catch (Exception e) {
                    log.warn("Failed to get cover image URL for album: {}", album.getId(), e);
                    coverImageUrl = null;
                }
            } else {
                coverImageUrl = null;
            }

            String userNickname = "알 수 없는 사용자";
            String userProfileImageUrl = null;
            try {
                ProfileResponseDTO profile = getProfileByUserId(album.getUserId());
                if (profile != null) {
                    userNickname = profile.getNickname() != null ? profile.getNickname() : "사용자 " + album.getUserId();
                    userProfileImageUrl = profile.getProfileImageUrl();
                }
            } catch (Exception e) {
                log.warn("Failed to get user profile for userId: {}", album.getUserId(), e);
                userNickname = "사용자 " + album.getUserId();
            }

            return AlbumResponseDto.from(album, coverImageUrl, userNickname, userProfileImageUrl);
        });
        return LikedAlbumsResponseDTO.from(albumDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public UserAlbumsResponseDTO getMyAlbums(Long userId, Pageable pageable) {
        Page<Album> userAlbums = albumRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        Page<AlbumResponseDto> albumDtos = userAlbums.map(album -> {
            String coverImageUrl;
            if (album.getUploadId() != null) {
                try {
                    coverImageUrl = fileUploadService.getFileUrl(album.getUploadId());
                } catch (Exception e) {
                    log.warn("Failed to get cover image URL for album: {}", album.getId(), e);
                    coverImageUrl = null;
                }
            } else {
                coverImageUrl = null;
            }

            String userNickname = "알 수 없는 사용자";
            String userProfileImageUrl = null;
            try {
                ProfileResponseDTO profile = getProfileByUserId(album.getUserId());
                if (profile != null) {
                    userNickname = profile.getNickname() != null ? profile.getNickname() : "사용자 " + album.getUserId();
                    userProfileImageUrl = profile.getProfileImageUrl();
                }
            } catch (Exception e) {
                log.warn("Failed to get user profile for userId: {}", album.getUserId(), e);
                userNickname = "사용자 " + album.getUserId();
            }

            return AlbumResponseDto.from(album, coverImageUrl, userNickname, userProfileImageUrl);
        });
        return UserAlbumsResponseDTO.from(albumDtos);
    }

    private ProfileResponseDTO toResponseDTO(Profile profile) {
        String profileImageUrl = profileImageService.getProfileImageUrl(profile.getProfileImageUpload());
        String backgroundImageUrl = profileImageService.getProfileImageUrl(profile.getBackgroundImageUpload());

        return ProfileResponseDTO.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .profileImageUrl(profileImageUrl)
                .backgroundImageUrl(backgroundImageUrl)
                .nickname(profile.getNickname())
                .gender(profile.getGender())
                .description(profile.getDescription())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
