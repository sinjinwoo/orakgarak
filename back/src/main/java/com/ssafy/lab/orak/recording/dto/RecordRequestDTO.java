package com.ssafy.lab.orak.recording.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordRequestDTO {
    
    @NotBlank(message = "제목은 필수입니다")
    private String title;
    
    private Long songId;
    
    @NotNull(message = "오디오 파일은 필수입니다")
    private MultipartFile audioFile;
}