package com.ssafy.lab.orak.recording.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.upload.entity.Upload;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "records")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Record extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long songId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Long uploadId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploadId", insertable = false, updatable = false)
    private Upload upload;

    private Integer durationSeconds;

    @Column(name = "vector_analysis_error_message")
    @Setter
    private String vectorAnalysisErrorMessage;

    @Column(name = "vector_analysis_retry_count")
    @Builder.Default
    @Setter
    private Integer vectorAnalysisRetryCount = 0;

    @Column(name = "vector_analysis_last_failed_at")
    @Setter
    private LocalDateTime vectorAnalysisLastFailedAt;

}
