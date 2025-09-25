package com.ssafy.lab.orak.aidemo.dto;

import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateRequestDTO {

    @NotNull(message = "상태는 필수입니다")
    private ApplicationStatus status;

    private String adminNote;
}