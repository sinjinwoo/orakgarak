package com.ssafy.lab.orak.profile.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDTO {

    private Long id;
    private Long userId;
    private String profileImageUrl;
    private String nickname;
    private String gender;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
