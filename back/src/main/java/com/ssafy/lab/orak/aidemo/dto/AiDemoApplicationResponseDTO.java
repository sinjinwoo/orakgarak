package com.ssafy.lab.orak.aidemo.dto;

import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AiDemoApplicationResponseDTO {

    private Long id;
    private Long userId;
    private Long recordId;
    private List<String> youtubeLinks;
    private ApplicationStatus status;
    private String statusDescription;
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime processedAt;

    private RecordResponseDTO record;

    public static AiDemoApplicationResponseDTO of(Long id, Long userId, Long recordId,
                                                List<String> youtubeLinks, ApplicationStatus status,
                                                String adminNote, LocalDateTime createdAt,
                                                LocalDateTime updatedAt, LocalDateTime processedAt,
                                                RecordResponseDTO record) {
        return AiDemoApplicationResponseDTO.builder()
                .id(id)
                .userId(userId)
                .recordId(recordId)
                .youtubeLinks(youtubeLinks)
                .status(status)
                .statusDescription(status.getDescription())
                .adminNote(adminNote)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .processedAt(processedAt)
                .record(record)
                .build();
    }
}