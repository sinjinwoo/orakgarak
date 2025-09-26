package com.ssafy.lab.orak.auth.jwt.service;

import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * refresh token 레디스 간 로직 관리
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class TokenServiceImpl implements TokenService {

    private final RedisTemplate<String, Object> redisTemplate;
    @Value("${jwt.refresh-expiration}")
    private long refreshExpMin;

    @Override
    public void saveRefreshToken(Long userId, String refreshToken) {
        String key = "refresh:" + userId;
        redisTemplate.opsForValue()
                .set(key, refreshToken, refreshExpMin, TimeUnit.MILLISECONDS);
    }

    @Override
    public String getRefreshToken(Long userId) {
        return (String) redisTemplate.opsForValue()
                .get("refresh:" + userId);
    }

    @Override
    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete("refresh:" + userId);
    }

}

