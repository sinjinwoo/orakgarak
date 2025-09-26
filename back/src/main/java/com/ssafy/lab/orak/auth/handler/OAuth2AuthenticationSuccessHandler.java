package com.ssafy.lab.orak.auth.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.jwt.service.TokenService;
import com.ssafy.lab.orak.auth.jwt.util.JwtUtil;
import com.ssafy.lab.orak.auth.service.CustomOAuth2User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Log4j2
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/login/success}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oauth2User.getUser();

        String accessToken = jwtUtil.createAccessToken(user);
        String refreshToken = jwtUtil.createRefreshToken(user);

        // Redis에 리프레시 토큰 저장
        tokenService.saveRefreshToken(user.getId(), refreshToken);

        log.info("OAuth2 로그인 성공 - userId: {}, email: {}", user.getId(), user.getEmail());
        log.info("토큰 생성 및 Redis 저장 완료");

        // Refresh Token을 HttpOnly 쿠키로 설정
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // HTTPS에서는 true로 설정
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일
        response.addCookie(refreshTokenCookie);

        // 프론트엔드로 리다이렉트하면서 토큰 전달
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("accessToken", accessToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}