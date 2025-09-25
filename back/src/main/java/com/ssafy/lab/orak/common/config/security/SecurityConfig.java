package com.ssafy.lab.orak.common.config.security;

import com.ssafy.lab.orak.auth.jwt.filter.JwtAuthenticationFilter;
import com.ssafy.lab.orak.auth.handler.OAuth2AuthenticationSuccessHandler;
import com.ssafy.lab.orak.auth.service.CustomOAuth2UserService;
import com.ssafy.lab.orak.common.config.properties.ActuatorProperties;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(ActuatorProperties.class)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final ActuatorProperties actuatorProperties;

    @Value("${spring.web.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Value("${python.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    @Bean
    @Order(0) // Webhook을 위한 Security FilterChain 설정
    public SecurityFilterChain webhookSecurity(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/webhook/**",
                        "/records/async/upload-completed")
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );

        return http.build();
    }

    @Bean
    @Order(1) // JWT 인증을 위한 Security FilterChain 설정
    public SecurityFilterChain apiSecurity(HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .securityMatcher(request -> !request.getRequestURI().startsWith("/actuator")
                                         && !request.getRequestURI().startsWith("/api/webhook"))
                // 세션 미사용 (JWT 기반 인증)
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // CORS 설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 접근 제어
                .authorizeHttpRequests(auth -> auth
                        // 인증 없이 접근 가능한 경로 (순서 중요!)
                        .requestMatchers(
                                "/auth/**",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/test/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/api/images/**",
                                "/images/**"
                        ).permitAll()
                        // API 경로는 JWT 인증 필요 (웹훅 제외)
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                // OAuth2 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((req, res, ex) -> {
                            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                            if (auth == null) {
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                            } else {
                                res.sendError(HttpServletResponse.SC_FORBIDDEN);
                            }
                        })
                )
                // JWT 인증 필터 등록
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    @Order(2) // Basic auth를 위한 Security FilterChain 설정
    public SecurityFilterChain actuatorSecurity(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/actuator/**")
                .httpBasic(httpBasic -> {})
                .userDetailsService(actuatorUserDetailsService())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**").hasRole(actuatorProperties.roleName())
                        .anyRequest().denyAll()
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService actuatorUserDetailsService() {
        var user = User.withUsername(actuatorProperties.user())
                .password(passwordEncoder().encode(actuatorProperties.password()))
                .roles(actuatorProperties.roleName())
                .build();

        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);

        // Frontend origins과 Python service origin 추가
        List<String> allAllowedOrigins = new java.util.ArrayList<>(List.of(allowedOrigins));
        allAllowedOrigins.add(pythonServiceUrl);

        configuration.setAllowedOriginPatterns(allAllowedOrigins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

