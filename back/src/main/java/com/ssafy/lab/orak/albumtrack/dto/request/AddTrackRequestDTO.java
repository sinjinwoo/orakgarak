package com.ssafy.lab.orak.albumtrack.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddTrackRequestDTO {

    @NotNull(message = "녹음 ID는 필수입니다")
    private Long recordId;

    @NotNull(message = "트랙 순서는 필수입니다")
    @Min(value = 1, message = "트랙 순서는 1 이상이어야 합니다")
    private Integer trackOrder;
}