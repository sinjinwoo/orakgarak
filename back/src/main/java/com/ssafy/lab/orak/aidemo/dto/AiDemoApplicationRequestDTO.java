package com.ssafy.lab.orak.aidemo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiDemoApplicationRequestDTO {

    @NotNull(message = "녹음본 ID 목록은 필수입니다")
    @Size(min = 1, message = "녹음본은 1개 이상 선택해주세요")
    private List<Long> recordIds;

    @NotNull(message = "유튜브 링크는 필수입니다")
    @Size(min = 1, max = 3, message = "유튜브 링크는 1개 이상 3개 이하로 입력해주세요")
    private List<@Pattern(regexp = "^https?://(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)[a-zA-Z0-9_-]+.*$",
                          message = "올바른 유튜브 링크 형식이 아닙니다") String> youtubeLinks;
}