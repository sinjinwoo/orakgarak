package com.ssafy.lab.orak.auth.jwt.filter;

import com.ssafy.lab.orak.auth.jwt.util.JwtUtil;
import com.ssafy.lab.orak.auth.service.CustomUserDetailsService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Log4j2
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        log.info("JWT Filter - 요청 경로: {} (메서드: {})", path, request.getMethod());

        if (path.startsWith("/api/oauth2/") ||
                path.startsWith("/oauth2/") ||
                path.startsWith("/api/login/oauth2/") ||
                path.startsWith("/login/oauth2/") ||
                path.startsWith("/api/login") ||
                path.startsWith("/login") ||
                path.startsWith("/api/auth/refresh") ||
                path.startsWith("/auth/refresh") ||
                path.startsWith("/api/test/") ||
                path.startsWith("/test/") ||
                path.startsWith("/api/yjs/") ||
                path.startsWith("/yjs/") ||
                path.startsWith("/api/swagger-ui/") ||
                path.startsWith("/swagger-ui/") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api-docs") ||
                path.startsWith("/api/api-docs") ||
                path.startsWith("/api/images") ||
                path.startsWith("/images") ||
                path.startsWith("/api/webhook/") ||
                path.equals("/api/records/async/upload-completed") ||
                path.equals("/records/async/upload-completed") ||
                path.startsWith("/api/actuator") ||
                path.startsWith("/webhook/") ||
                path.startsWith("/actuator")) {
            log.info("JWT Filter - Bypassing authentication for path: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        String accessToken = extractToken(request);
        log.info("JWT Filter - 토큰 추출 결과: {}", accessToken != null ? "토큰 있음" : "토큰 없음");
        log.debug("accessToken: {}", accessToken);

        // 유효한 토큰인 경우 인증 정보 설정
        if (accessToken != null) {
            log.info("JWT Filter - 토큰 검증 시작");
            if (jwtUtil.validateToken(accessToken)) {
                log.info("JWT Filter - 토큰 검증 성공");
                try {
                    Claims claims = jwtUtil.getClaims(accessToken);
                    Long userId = Long.valueOf(claims.getSubject());
                    log.info("JWT Filter - Claims에서 userId 추출: {}", userId);
                    setAuthentication(userId, request);
                    log.info("JWT Filter - 인증 정보 설정 완료");
                } catch (Exception e) {
                    log.error("JWT Filter - 인증 정보 설정 중 오류: {}", e.getMessage(), e);
                }
            } else {
                log.warn("JWT Filter - 토큰 검증 실패");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
                response.getWriter().write("JWT token is invalid or expired.");
                return;
            }
        } else {
            log.warn("JWT Filter - 토큰이 없음");
            // 토큰이 없으면 401 반환
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            response.getWriter().write("JWT token is required.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(Long userId, HttpServletRequest request) {
        log.info("setAuthentication - userId로 UserDetails 조회 시작: {}", userId);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(
                String.valueOf(userId));
        log.info("setAuthentication - UserDetails 조회 성공: {}", userDetails.getUsername());

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.info("setAuthentication - SecurityContext에 인증 정보 설정 완료");

        // JWT 인증에서는 세션 사용하지 않음을 명시
        request.getSession(false); // 기존 세션이 있어도 새로 생성하지 않음
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        log.info("extractToken - Authorization 헤더: {}", header != null ? "있음" : "없음");
        log.debug("extractToken - Authorization 헤더 값: {}", header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            log.info("extractToken - Bearer 토큰 추출 성공");
            return token;
        }
        log.warn("extractToken - Bearer 토큰 형식이 아님 또는 헤더 없음");
        return null;
    }
}

