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
    private List<Long> recordIds;
    private List<String> youtubeLinks;
    private ApplicationStatus status;
    private String statusDescription;
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime processedAt;

    private List<RecordResponseDTO> records;

    public static AiDemoApplicationResponseDTO of(Long id, Long userId, List<Long> recordIds,
                                                List<String> youtubeLinks, ApplicationStatus status,
                                                String adminNote, LocalDateTime createdAt,
                                                LocalDateTime updatedAt, LocalDateTime processedAt,
                                                List<RecordResponseDTO> records) {
        return AiDemoApplicationResponseDTO.builder()
                .id(id)
                .userId(userId)
                .recordIds(recordIds)
                .youtubeLinks(youtubeLinks)
                .status(status)
                .statusDescription(status.getDescription())
                .adminNote(adminNote)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .processedAt(processedAt)
                .records(records)
                .build();
    }
}