package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.UserService;
import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.exception.ProfileNotFoundException;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import com.ssafy.lab.orak.upload.entity.Upload;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;
    private final ProfileImageService profileImageService;

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
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return false;
        }
        return !profileRepository.existsByNickname(nickname);
    }

    private ProfileResponseDTO toResponseDTO(Profile profile) {
        String profileImageUrl = profileImageService.getProfileImageUrl(profile.getProfileImageUpload());

        return ProfileResponseDTO.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .profileImageUrl(profileImageUrl)
                .nickname(profile.getNickname())
                .gender(profile.getGender())
                .description(profile.getDescription())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
