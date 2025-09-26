package com.ssafy.lab.orak.auth.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Log4j2
@Component
@RequiredArgsConstructor
public class RedisOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String KEY_PREFIX = "oauth2:auth_request:";
    private static final Duration TTL = Duration.ofMinutes(5); // 5분 TTL

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        String state = getStateParameter(request);
        if (state == null) {
            log.warn("OAuth2 요청에서 state 파라미터를 찾을 수 없습니다: {}", request.getRequestURI());
            return null;
        }

        String key = KEY_PREFIX + state;
        log.info("Redis에서 OAuth2 인증 요청 조회: key={}", key);

        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                log.warn("Redis에서 OAuth2 인증 요청을 찾을 수 없습니다: key={}", key);
                return null;
            }

            OAuth2AuthorizationRequest authRequest = objectMapper.readValue(value.toString(), OAuth2AuthorizationRequest.class);
            log.info("Redis에서 OAuth2 인증 요청 조회 성공: state={}", state);
            return authRequest;
        } catch (JsonProcessingException e) {
            log.error("OAuth2 인증 요청 역직렬화 실패: key={}", key, e);
            return null;
        }
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                       HttpServletRequest request,
                                       HttpServletResponse response) {
        if (authorizationRequest == null) {
            log.info("OAuth2 인증 요청이 null이므로 저장하지 않습니다");
            return;
        }

        String state = authorizationRequest.getState();
        String key = KEY_PREFIX + state;

        try {
            String value = objectMapper.writeValueAsString(authorizationRequest);
            redisTemplate.opsForValue().set(key, value, TTL);
            log.info("Redis에 OAuth2 인증 요청 저장 완료: key={}, TTL={}분", key, TTL.toMinutes());
        } catch (JsonProcessingException e) {
            log.error("OAuth2 인증 요청 직렬화 실패: state={}", state, e);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                               HttpServletResponse response) {
        String state = getStateParameter(request);
        if (state == null) {
            log.warn("OAuth2 요청에서 state 파라미터를 찾을 수 없습니다 (제거 시): {}", request.getRequestURI());
            return null;
        }

        String key = KEY_PREFIX + state;
        log.info("Redis에서 OAuth2 인증 요청 제거: key={}", key);

        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                log.warn("Redis에서 제거할 OAuth2 인증 요청을 찾을 수 없습니다: key={}", key);
                return null;
            }

            OAuth2AuthorizationRequest authRequest = objectMapper.readValue(value.toString(), OAuth2AuthorizationRequest.class);
            redisTemplate.delete(key);
            log.info("Redis에서 OAuth2 인증 요청 제거 완료: state={}", state);
            return authRequest;
        } catch (JsonProcessingException e) {
            log.error("OAuth2 인증 요청 역직렬화 실패 (제거 시): key={}", key, e);
            // 역직렬화 실패해도 Redis에서는 제거
            redisTemplate.delete(key);
            return null;
        }
    }

    private String getStateParameter(HttpServletRequest request) {
        return request.getParameter("state");
    }
}