package com.ssafy.lab.orak.auth.service;

import com.ssafy.lab.orak.auth.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
@RequiredArgsConstructor
public class CustomOAuth2User implements OAuth2User {
    
    private final User user;
    private final Map<String, Object> attributes;
    
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }
    
    @Override
    public String getName() {
        return user.getNickname();
    }
    
    public Long getUserId() {
        return user.getId();
    }
    
    public String getEmail() {
        return user.getEmail();
    }
}