package com.ssafy.lab.orak.albumtrack.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderTrackRequestDTO {

    @NotNull(message = "현재 순서는 필수입니다")
    private Integer fromOrder;

    @NotNull(message = "변경할 순서는 필수입니다")
    private Integer toOrder;
}