package com.ssafy.lab.orak.albumtrack.entity;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.recording.entity.Record;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "album_tracks", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"album_id", "track_order"}),
           @UniqueConstraint(columnNames = {"album_id", "record_id"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private Record record;

    @Column(name = "track_order", nullable = false)
    private Integer trackOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // 비즈니스 로직
    public boolean isValidOrder() {
        return trackOrder != null && trackOrder > 0;
    }

    public boolean belongsToAlbum(Long albumId) {
        return album != null && album.getId().equals(albumId);
    }

    public boolean isOwnedByUser(Long userId) {
        return album != null && album.isOwnedBy(userId);
    }
}