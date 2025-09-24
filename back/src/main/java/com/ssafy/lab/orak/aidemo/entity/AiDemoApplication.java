package com.ssafy.lab.orak.aidemo.entity;

import com.ssafy.lab.orak.aidemo.converter.YouTubeLinksConverter;
import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.recording.entity.Record;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ai_demo_applications")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AiDemoApplication extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long recordId;

    @Convert(converter = YouTubeLinksConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> youtubeLinks;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recordId", insertable = false, updatable = false)
    private Record record;

    public void updateStatus(ApplicationStatus newStatus, String adminNote) {
        this.status = newStatus;
        this.adminNote = adminNote;
        this.processedAt = LocalDateTime.now();
    }

    public void approve(String adminNote) {
        updateStatus(ApplicationStatus.APPROVED, adminNote);
    }

    public void reject(String adminNote) {
        updateStatus(ApplicationStatus.REJECTED, adminNote);
    }

    public void complete(String adminNote) {
        updateStatus(ApplicationStatus.COMPLETED, adminNote);
    }

    public boolean isPending() {
        return ApplicationStatus.PENDING.equals(this.status);
    }

    public boolean isApproved() {
        return ApplicationStatus.APPROVED.equals(this.status);
    }

    public boolean isCompleted() {
        return ApplicationStatus.COMPLETED.equals(this.status);
    }
}