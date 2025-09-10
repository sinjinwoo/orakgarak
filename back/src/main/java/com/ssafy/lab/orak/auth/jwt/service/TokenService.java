package com.ssafy.lab.orak.auth.jwt.service;

public interface TokenService {

    void saveRefreshToken(Long userId, String refreshToken);

    String getRefreshToken(Long userId);

    void deleteRefreshToken(Long userId);
}


