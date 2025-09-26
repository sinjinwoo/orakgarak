package com.ssafy.lab.orak.auth.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Base64;

@Log4j2
@Component
public class CookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private final ObjectMapper objectMapper;

    public CookieOAuth2AuthorizationRequestRepository(@Qualifier("oauth2ObjectMapper") ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private static final String COOKIE_NAME = "oauth2_auth_request";
    private static final int COOKIE_EXPIRE_SECONDS = 180; // 3분

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        log.info("쿠키에서 OAuth2 인증 요청 로드 시작 - URI: {}", request.getRequestURI());

        // 모든 쿠키 확인
        Cookie[] allCookies = request.getCookies();
        if (allCookies != null) {
            log.info("전체 쿠키 개수: {}", allCookies.length);
            for (Cookie c : allCookies) {
                log.info("쿠키 발견: name={}, value={}, path={}, domain={}",
                    c.getName(), c.getValue().length() > 50 ? c.getValue().substring(0, 50) + "..." : c.getValue(),
                    c.getPath(), c.getDomain());
            }
        } else {
            log.error("요청에 쿠키가 전혀 없습니다!");
        }

        Cookie cookie = getCookie(request, COOKIE_NAME);
        if (cookie == null) {
            log.error("OAuth2 인증 요청 쿠키를 찾을 수 없습니다: cookieName={}", COOKIE_NAME);
            return null;
        }

        try {
            String decodedValue = new String(Base64.getDecoder().decode(cookie.getValue()));
            OAuth2AuthorizationRequest authRequest = objectMapper.readValue(decodedValue, OAuth2AuthorizationRequest.class);
            log.info("쿠키에서 OAuth2 인증 요청 로드 성공: state={}", authRequest.getState());
            return authRequest;
        } catch (Exception e) {
            log.error("OAuth2 인증 요청 쿠키 역직렬화 실패", e);
            return null;
        }
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                       HttpServletRequest request,
                                       HttpServletResponse response) {
        if (authorizationRequest == null) {
            log.info("OAuth2 인증 요청이 null이므로 쿠키를 삭제합니다");
            deleteCookie(request, response, COOKIE_NAME);
            return;
        }

        try {
            String value = objectMapper.writeValueAsString(authorizationRequest);
            String encodedValue = Base64.getEncoder().encodeToString(value.getBytes());

            Cookie cookie = new Cookie(COOKIE_NAME, encodedValue);
            cookie.setPath("/api"); // context-path 고려
            cookie.setHttpOnly(true);
            cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);
            cookie.setSecure(true); // 배포 환경 HTTPS

            response.addCookie(cookie);
            log.info("OAuth2 인증 요청을 쿠키에 저장 완료: state={}, cookieName={}, path=/api, secure=true",
                authorizationRequest.getState(), COOKIE_NAME);
            log.info("저장된 쿠키 값 길이: {}", encodedValue.length());
        } catch (JsonProcessingException e) {
            log.error("OAuth2 인증 요청 쿠키 직렬화 실패", e);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                               HttpServletResponse response) {
        log.info("쿠키에서 OAuth2 인증 요청 제거 시작 - URI: {}", request.getRequestURI());
        log.info("요청 파라미터 state: {}", request.getParameter("state"));

        OAuth2AuthorizationRequest authRequest = loadAuthorizationRequest(request);
        if (authRequest != null) {
            deleteCookie(request, response, COOKIE_NAME);
            log.info("OAuth2 인증 요청 쿠키 제거 완료: state={}", authRequest.getState());
        } else {
            log.error("제거할 OAuth2 인증 요청 쿠키가 없습니다! cookieName={}", COOKIE_NAME);
        }

        return authRequest;
    }

    private Cookie getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name) && StringUtils.hasText(cookie.getValue())) {
                    return cookie;
                }
            }
        }
        return null;
    }

    private void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie cookie = getCookie(request, name);
        if (cookie != null) {
            Cookie deleteCookie = new Cookie(name, "");
            deleteCookie.setPath("/api"); // context-path 고려
            deleteCookie.setHttpOnly(true);
            deleteCookie.setMaxAge(0);
            deleteCookie.setSecure(true); // 배포 환경 HTTPS
            response.addCookie(deleteCookie);
        }
    }
}