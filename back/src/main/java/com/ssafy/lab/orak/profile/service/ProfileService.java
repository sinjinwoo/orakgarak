package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {

    ProfileResponseDTO getMyProfile(Long userId);

    ProfileResponseDTO getProfileByUserId(Long userId);

    ProfileResponseDTO upsertMyProfile(Long userId, ProfileRequestDTO request);

    ProfileResponseDTO updateProfileWithImage(Long userId, MultipartFile imageFile, String nickname, String gender, String description);

    boolean isNicknameAvailable(String nickname);
}
