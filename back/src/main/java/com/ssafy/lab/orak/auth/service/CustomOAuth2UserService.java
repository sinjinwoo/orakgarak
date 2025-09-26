package com.ssafy.lab.orak.auth.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.repository.UserRepository;
import com.ssafy.lab.orak.profile.service.DefaultProfileService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Log4j2
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final DefaultProfileService defaultProfileService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("=== CustomOAuth2UserService.loadUser 시작 ===");

        try {
            log.info("OAuth2 사용자 정보 로드 시작");
            OAuth2User oauth2User = super.loadUser(userRequest);
            log.info("OAuth2 사용자 정보 로드 완료");

            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            Map<String, Object> attributes = oauth2User.getAttributes();

            log.info("OAuth2 Provider: {}", registrationId);
            log.info("OAuth2 사용자 속성 개수: {}", attributes.size());

            if ("google".equals(registrationId)) {
                log.info("Google OAuth2 사용자 처리 시작");
                OAuth2User result = processGoogleUser(attributes);
                log.info("Google OAuth2 사용자 처리 완료");
                return result;
            }

            log.error("지원하지 않는 OAuth2 Provider: {}", registrationId);
            throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + registrationId);
        } catch (Exception e) {
            log.error("CustomOAuth2UserService에서 예외 발생", e);
            throw new OAuth2AuthenticationException("OAuth2 사용자 로드 실패: " + e.getMessage());
        }
    }

    private OAuth2User processGoogleUser(Map<String, Object> attributes) {
        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        log.info("Google OAuth2 user info - googleId: {}, email: {}, name: {}", googleId, email,
                name);

        log.info("데이터베이스에서 기존 사용자 조회 시작 - googleId: {}", googleId);
        User user = userRepository.findByGoogleID(googleId)
                .orElseGet(() -> {
                    log.info("기존 사용자 없음 - 새 사용자 생성 진행");
                    return createNewUser(googleId, email, name);
                });

        if (user.getId() != null) {
            log.info("기존 사용자 발견 - userId: {}", user.getId());
        }

        log.info("CustomOAuth2User 객체 생성");
        return new CustomOAuth2User(user, attributes);
    }

    private User createNewUser(String googleId, String email, String name) {
        log.info("=== 새 사용자 생성 시작: googleId={}, email={} ===", googleId, email);

        try {
            User newUser = User.builder()
                    .googleID(googleId)
                    .email(email)
                    .build();

            User savedUser = userRepository.save(newUser);
            log.info("Created new user: {}", savedUser.getId());

            // 기본 프로필 생성
            try {
                defaultProfileService.createDefaultProfile(savedUser);
                log.info("Created default profile for user: {}", savedUser.getId());
            } catch (Exception e) {
                log.error("기본 프로필 생성 실패: userId={}", savedUser.getId(), e);
                // 프로필 생성 실패해도 사용자는 생성됨
            }

            return savedUser;
        } catch (Exception e) {
            log.error("새 사용자 생성 실패: googleId={}, email={}", googleId, email, e);
            throw new RuntimeException("사용자 생성 실패", e);
        }
    }
}