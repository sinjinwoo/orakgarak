package com.ssafy.lab.orak.album.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "albums")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "upload_id")
    private Long uploadId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    @Column(name = "track_count", nullable = false)
    @Builder.Default
    private Integer trackCount = 0;

    @Column(name = "total_duration", nullable = false)
    @Builder.Default
    private Integer totalDuration = 0;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean canBeAccesseBy(Long currentUserId) {
        return this.isPublic ||
                (currentUserId != null && this.userId.equals(currentUserId));
    }

    public boolean canAddTrack() {
        return this.trackCount < 10;
    }

    public boolean isComplete() {
        return this.trackCount > 0 && this.uploadId != null;
    }

    public boolean isOwnedBy(Long userId) {
        return this.userId != null && this.userId.equals(userId);
    }
}