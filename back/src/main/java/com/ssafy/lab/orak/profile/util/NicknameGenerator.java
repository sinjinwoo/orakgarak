package com.ssafy.lab.orak.profile.util;

import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Log4j2
public class NicknameGenerator {

    private final ProfileRepository profileRepository;

    private static final String PREFIX = "User_";
    private static final int UUID_LENGTH = 8;
    private static final int MAX_RETRY_ATTEMPTS = 10;

    public String generateUniqueNickname() {
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            String nickname = generateRandomNickname();

            if (!profileRepository.existsByNickname(nickname)) {
                log.info("유니크 닉네임 생성 완료 - nickname: {} (시도 횟수: {})", nickname, attempt);
                return nickname;
            }

            log.warn("닉네임 중복 발생 - nickname: {} (시도 횟수: {})", nickname, attempt);
        }

        // 최대 시도 횟수 초과 시 타임스탬프 추가
        String fallbackNickname = generateRandomNickname() + "_" + System.currentTimeMillis();
        log.warn("최대 재시도 횟수 초과, 타임스탬프 추가 - nickname: {}", fallbackNickname);
        return fallbackNickname;
    }

    private String generateRandomNickname() {
        String uuid = UUID.randomUUID().toString().replaceAll("-", "");
        return PREFIX + uuid.substring(0, UUID_LENGTH);
    }

    public boolean isNicknameAvailable(String nickname) {
        return !profileRepository.existsByNickname(nickname);
    }
}