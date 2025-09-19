package com.ssafy.lab.orak.albumtrack.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkAddTracksRequestDTO {

    @NotNull(message = "트랙 목록은 필수입니다")
    @Valid
    private List<AddTrackRequestDTO> tracks;
}