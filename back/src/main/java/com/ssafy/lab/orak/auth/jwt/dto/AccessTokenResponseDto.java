package com.ssafy.lab.orak.auth.jwt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class AccessTokenResponseDto {

    private String accessToken;
    private String refreshToken;
}
