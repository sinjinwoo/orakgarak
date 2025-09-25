package com.ssafy.lab.orak.album.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumCreateRequestDto {

    @NotBlank
    @Size(max = 100, message = "앨범 제목은 100자 이하")
    private String title;

    @Size(max = 500, message = "설명은 500자 이하")
    private String description;

    private Long uploadId;

    @NotNull(message = "공개 설정은 필수")
    private Boolean isPublic;

    // 앨범 생성과 동시에 트랙 추가를 위한 필드들
    @Size(max = 10, message = "트랙은 최대 10개까지 추가할 수 있습니다")
    private List<Long> recordIds;  // 선택된 녹음본 ID 리스트

    @Size(max = 10, message = "트랙은 최대 10개까지 추가할 수 있습니다")
    private List<Integer> trackOrders;  // 각 녹음본의 순서 (recordIds가 있으면 필수)

    // 커스텀 검증: recordIds가 있으면 trackOrders도 있어야 하고, 개수가 같아야 함
    public boolean hasValidTrackData() {
        // 둘 다 없으면 OK
        if ((recordIds == null || recordIds.isEmpty()) &&
            (trackOrders == null || trackOrders.isEmpty())) {
            return true;
        }

        // recordIds가 있으면 trackOrders도 있어야 함
        if (recordIds != null && !recordIds.isEmpty()) {
            if (trackOrders == null || trackOrders.isEmpty()) {
                return false;
            }

            // 개수가 같아야 함
            if (recordIds.size() != trackOrders.size()) {
                return false;
            }

            // recordIds에 null이나 0 이하 값이 있으면 안됨
            for (Long recordId : recordIds) {
                if (recordId == null || recordId <= 0) {
                    return false;
                }
            }

            // trackOrders에 null이나 0 이하 값이 있으면 안됨
            for (Integer trackOrder : trackOrders) {
                if (trackOrder == null || trackOrder <= 0) {
                    return false;
                }
            }

            return true;
        }

        // trackOrders만 있으면 안됨
        return false;
    }
}