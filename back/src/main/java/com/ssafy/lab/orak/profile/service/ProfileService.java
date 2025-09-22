package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.profile.dto.LikedAlbumsResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.dto.ProfileStatsResponseDTO;
import com.ssafy.lab.orak.profile.dto.UserAlbumsResponseDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {

    ProfileResponseDTO getMyProfile(Long userId);

    ProfileResponseDTO getProfileByUserId(Long userId);

    ProfileResponseDTO upsertMyProfile(Long userId, ProfileRequestDTO request);

    ProfileResponseDTO updateProfileWithImage(Long userId, MultipartFile imageFile, String nickname, String gender, String description);

    ProfileResponseDTO updateBackgroundImage(Long userId, MultipartFile imageFile);

    ProfileResponseDTO removeBackgroundImage(Long userId);

    boolean isNicknameAvailable(String nickname);

    ProfileStatsResponseDTO getMyPageStats(Long userId);

    LikedAlbumsResponseDTO getLikedAlbums(Long userId, Pageable pageable);

    UserAlbumsResponseDTO getMyAlbums(Long userId, Pageable pageable);
}
