package com.ssafy.lab.orak.auth.jwt.util;

import com.ssafy.lab.orak.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Log4j2
public class JwtUtil {

    private final SecretKey key;
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long accessExpMin,
            @Value("${jwt.refresh-expiration}") long refreshExpMin
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpMs = accessExpMin;   // 분 → ms 변환
        this.refreshExpMs = refreshExpMin;
    }

    // 이메일은 accessToken 만들때만 사용
    public String createAccessToken(User user) {
        return createToken(String.valueOf(user.getId()), accessExpMs,
                Map.of("email", user.getGoogleID(), "type", "access"));
    }

    public String createRefreshToken(User user) {
        return createToken(String.valueOf(user.getId()), refreshExpMs, Map.of("type", "refresh"));
    }

    private String createToken(String subject, long expireMs, Map<String, Object> claims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireMs);

        String token = Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
        log.debug("JWT 생성됨: {}", token);
        return token;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            log.debug("JWT 검증 성공");
            return true;
        } catch (Exception e) {
            log.error("JWT 검증 실패: {}", e.getMessage(), e);
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
