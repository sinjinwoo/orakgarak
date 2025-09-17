package com.ssafy.lab.orak.profile.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequestDTO {

    @Size(max = 50, message = "닉네임은 50자를 초과할 수 없습니다")
    private String nickname;
    @Size(max = 50, message = "성별은 50자를 초과할 수 없습니다")
    private String gender;
    @Size(max = 1000, message = "설명은 1000자를 초과할 수 없습니다")
    private String description;
}
