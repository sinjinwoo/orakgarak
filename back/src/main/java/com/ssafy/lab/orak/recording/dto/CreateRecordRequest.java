package com.ssafy.lab.orak.recording.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Record 생성 요청 DTO
 * - Presigned URL로 파일 업로드 완료 후 Record 메타데이터 저장용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecordRequest {

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotNull(message = "업로드 ID는 필수입니다")
    private Long uploadId;

    private Long songId;

    /**
     * 오디오 파일 재생 시간 (초)
     * - 녹음: 프론트에서 녹음 시간 측정
     * - 외부파일: 프론트에서 HTML5 Media API로 duration 추출
     */
    private Integer durationSeconds;
}