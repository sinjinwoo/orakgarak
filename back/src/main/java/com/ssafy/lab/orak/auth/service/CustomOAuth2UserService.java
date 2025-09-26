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
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oauth2User.getAttributes();

        if ("google".equals(registrationId)) {
            return processGoogleUser(attributes);
        }

        throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + registrationId);
    }

    private OAuth2User processGoogleUser(Map<String, Object> attributes) {
        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        log.info("Google OAuth2 user info - googleId: {}, email: {}, name: {}", googleId, email,
                name);

        User user = userRepository.findByGoogleID(googleId)
                .orElseGet(() -> createNewUser(googleId, email, name));

        return new CustomOAuth2User(user, attributes);
    }

    private User createNewUser(String googleId, String email, String name) {
        User newUser = User.builder()
                .googleID(googleId)
                .email(email)
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Created new user: {}", savedUser.getId());
        
        // 기본 프로필 생성
        defaultProfileService.createDefaultProfile(savedUser);
        log.info("Created default profile for user: {}", savedUser.getId());
        
        return savedUser;
    }
}