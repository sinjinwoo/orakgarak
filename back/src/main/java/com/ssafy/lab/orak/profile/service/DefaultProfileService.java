package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import com.ssafy.lab.orak.profile.util.NicknameGenerator;
import com.ssafy.lab.orak.upload.entity.Upload;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Log4j2
public class DefaultProfileService {

    private final ProfileRepository profileRepository;
    private final NicknameGenerator nicknameGenerator;
    private final ProfileImageService profileImageService;

    @Transactional
    public Profile createDefaultProfile(User user) {
        String defaultNickname = nicknameGenerator.generateUniqueNickname();

        Profile profile = Profile.builder()
                .user(user)
                .nickname(defaultNickname)
                .profileImageUpload(null) // 기본 이미지는 null로 유지
                .build();

        Profile savedProfile = profileRepository.save(profile);
        log.info("기본 프로필 생성 완료 - userId: {}, nickname: {} (기본 이미지 사용)",
                user.getId(), defaultNickname);

        return savedProfile;
    }
}