package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.UserService;
import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.exception.ProfileNotFoundException;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
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

        // 기존 이미지가 있으면 삭제
        if (profile.getProfileImageS3Key() != null) {
            profileImageService.deleteProfileImage(profile.getProfileImageS3Key());
        }

        // 새 이미지 업로드
        String s3Key = profileImageService.uploadProfileImage(imageFile, userId);
        
        // 프로필 업데이트
        profile.update(s3Key, nickname, gender, description);

        Profile saved = profileRepository.save(profile);
        log.info("프로필 이미지 업로드 및 업데이트 완료 - userId: {} profileId: {}", userId, saved.getId());
        return toResponseDTO(saved);
    }


    private ProfileResponseDTO toResponseDTO(Profile profile) {
        String profileImageUrl = profileImageService.getProfileImageUrl(profile.getProfileImageS3Key());
        
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
