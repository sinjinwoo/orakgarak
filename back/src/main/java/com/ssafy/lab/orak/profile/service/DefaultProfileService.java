package com.ssafy.lab.orak.profile.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import com.ssafy.lab.orak.profile.util.NicknameGenerator;
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
        String defaultImagePath = profileImageService.getRandomDefaultImagePath();
        
        Profile profile = Profile.builder()
                .user(user)
                .nickname(defaultNickname)
                .profileImageS3Key(defaultImagePath)
                .build();
        
        Profile savedProfile = profileRepository.save(profile);
        log.info("기본 프로필 생성 완료 - userId: {}, nickname: {}, image: {}", 
                user.getId(), defaultNickname, defaultImagePath);
        
        return savedProfile;
    }
}