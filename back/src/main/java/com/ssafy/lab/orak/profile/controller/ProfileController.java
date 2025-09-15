package com.ssafy.lab.orak.profile.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.profile.dto.ProfileRequestDTO;
import com.ssafy.lab.orak.profile.dto.ProfileResponseDTO;
import com.ssafy.lab.orak.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // 내 프로필 조회
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDTO> getMyProfile(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        ProfileResponseDTO response = profileService.getMyProfile(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    // 특정 사용자 프로필 조회
    @GetMapping("/{userId}")
    public ResponseEntity<ProfileResponseDTO> getProfile(@PathVariable Long userId) {
        ProfileResponseDTO response = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(response);
    }

    // 내 프로필 생성/수정 (업서트)
    @PutMapping("/me")
    public ResponseEntity<ProfileResponseDTO> upsertMyProfile(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody ProfileRequestDTO request
    ) {
        ProfileResponseDTO response = profileService.upsertMyProfile(principal.getUserId(),
                request);
        return ResponseEntity.ok(response);
    }

    // 프로필 이미지 업로드
    @PostMapping("/me/image")
    public ResponseEntity<ProfileResponseDTO> uploadProfileImage(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "nickname", required = false) String nickname,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "description", required = false) String description
    ) {
        ProfileResponseDTO response = profileService.updateProfileWithImage(
                principal.getUserId(), imageFile, nickname, gender, description);
        return ResponseEntity.ok(response);
    }

}
