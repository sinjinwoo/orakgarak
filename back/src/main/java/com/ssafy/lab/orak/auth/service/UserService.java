package com.ssafy.lab.orak.auth.service;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.jwt.dto.AccessTokenResponseDto;
import com.ssafy.lab.orak.auth.jwt.service.TokenService;
import com.ssafy.lab.orak.auth.jwt.util.JwtUtil;
import com.ssafy.lab.orak.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + email));
    }
    
    public AccessTokenResponseDto refreshAccessToken(String refreshToken) {
        log.info("Refresh token 요청 시작, token length: {}", refreshToken.length());
        
        // 1. 토큰 유효성 검증
        if (!jwtUtil.validateToken(refreshToken)) {
            log.error("JWT 토큰 유효성 검증 실패");
            throw new RuntimeException("유효하지 않은 리프레시 토큰입니다");
        }
        log.info("JWT 토큰 유효성 검증 성공");
        
        // 2. 토큰에서 userId 추출
        String userId = jwtUtil.getClaims(refreshToken).getSubject();
        log.info("토큰에서 추출한 userId: {}", userId);
        
        // 3. Redis에 저장된 토큰과 비교
        String storedToken = tokenService.getRefreshToken(Long.valueOf(userId));
        log.info("Redis에서 조회한 토큰 존재 여부: {}", storedToken != null);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            log.error("Redis 토큰 비교 실패 - stored token null: {}, equals: {}", 
                storedToken == null, storedToken != null && storedToken.equals(refreshToken));
            throw new RuntimeException("유효하지 않은 리프레시 토큰입니다");
        }
        
        // 4. 새 토큰들 생성
        User user = findById(Long.valueOf(userId));
        String newAccessToken = jwtUtil.createAccessToken(user);
        String newRefreshToken = jwtUtil.createRefreshToken(user);
        
        // 5. 새 리프레시 토큰으로 Redis 업데이트 (토큰 로테이션)
        tokenService.saveRefreshToken(user.getId(), newRefreshToken);
        
        return AccessTokenResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }
    
    public void logout(Long userId) {
        log.info("사용자 로그아웃 처리 시작 - userId: {}", userId);
        
        // Redis에서 리프레시 토큰 삭제
        tokenService.deleteRefreshToken(userId);
        
        log.info("Redis에서 리프레시 토큰 삭제 완료 - userId: {}", userId);
    }
}