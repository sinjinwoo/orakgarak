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

        log.info("JWT Filter - Request path: {}", path);

        // OAuth2 관련 경로는 JWT 필터 건너뜀
        if (path.startsWith("/api/oauth2/") ||
            path.startsWith("/api/login/oauth2/") ||
            path.startsWith("/api/test/") ||
            path.equals("/api/auth/refresh") ||
            path.startsWith("/api/yjs/") ||
            path.startsWith("/api/swagger-ui/") ||
            path.startsWith("/swagger-ui/") ||
            path.startsWith("/v3/api-docs") ||
            path.startsWith("/api-docs") ||
            path.startsWith("/api/api-docs") ||
            path.startsWith("/actuator")) {
            log.info("JWT Filter - Bypassing authentication for path: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        String accessToken = extractToken(request);
        log.debug("accessToken: {}", accessToken);

        // 유효한 토큰인 경우 인증 정보 설정
        if (accessToken != null) {
            if (jwtUtil.validateToken(accessToken)) {
                try {
                    Claims claims = jwtUtil.getClaims(accessToken);
                    Long userId = Long.valueOf(claims.getSubject());
                    setAuthentication(userId, request);
                } catch (Exception e) {
                    log.warn("인증 정보 설정 중 오류: {}", e.getMessage());
                }
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
                response.getWriter().write("JWT token is invalid or expired.");
                return;
            }
        } else {
            log.info("JWT Filter - No token provided for non-actuator path: {}", path);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            response.getWriter().write("JWT token is required.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(Long userId, HttpServletRequest request) {
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(
                String.valueOf(userId));
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

