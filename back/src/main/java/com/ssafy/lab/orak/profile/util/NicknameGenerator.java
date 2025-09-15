package com.ssafy.lab.orak.profile.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class NicknameGenerator {

    private static final String PREFIX = "User_";
    private static final int UUID_LENGTH = 8;

    public String generateUniqueNickname() {
        String uuid = UUID.randomUUID().toString().replaceAll("-", "");
        return PREFIX + uuid.substring(0, UUID_LENGTH);
    }
}