package com.ssafy.lab.orak.auth.controller;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.exception.MissingRefreshTokenException;
import com.ssafy.lab.orak.auth.jwt.dto.AccessTokenResponseDto;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.auth.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal CustomUserPrincipal principal, 
                                   HttpServletRequest request, 
                                   HttpServletResponse response) {
        if (principal != null) {
            // Redis에서 리프레시 토큰 삭제
            userService.logout(principal.getUserId());
            log.info("사용자 로그아웃 - userId: {}", principal.getUserId());
        }
        
        // refreshToken 쿠키 삭제
        Cookie refreshTokenCookie = new Cookie("refreshToken", "");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // 즉시 만료
        response.addCookie(refreshTokenCookie);
        
        return ResponseEntity.ok(Map.of("message", "로그아웃 성공"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal CustomUserPrincipal principal) {
        User user = userService.findById(principal.getUserId());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponseDto> refresh(HttpServletRequest request, HttpServletResponse response) {
        // 쿠키에서 리프레시 토큰 추출
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }
        
        if (refreshToken == null) {
            throw new MissingRefreshTokenException("리프레시 토큰이 없습니다");
        }
        
        AccessTokenResponseDto tokenResponse = userService.refreshAccessToken(refreshToken);
        
        // 새로운 리프레시 토큰을 쿠키에 저장 (토큰 로테이션)
        if (tokenResponse.getRefreshToken() != null) {
            Cookie newRefreshTokenCookie = new Cookie("refreshToken", tokenResponse.getRefreshToken());
            newRefreshTokenCookie.setHttpOnly(true);
            newRefreshTokenCookie.setSecure(false); // HTTPS에서는 true로 설정
            newRefreshTokenCookie.setPath("/");
            newRefreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일
            response.addCookie(newRefreshTokenCookie);
        }
        
        // 응답에서는 accessToken만 반환 (refreshToken은 쿠키에 저장됨)
        return ResponseEntity.ok(AccessTokenResponseDto.builder()
                .accessToken(tokenResponse.getAccessToken())
                .build());
    }
}
