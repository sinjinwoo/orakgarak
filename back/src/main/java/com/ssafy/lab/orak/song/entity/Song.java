package com.ssafy.lab.orak.song.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "songs")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Song extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Long songId;

    @Column(nullable = false, length = 500)
    private String songName;

    @Column(length = 500)
    private String artistName;

    @Column(length = 500)
    private String albumName;

    @Column(columnDefinition = "TEXT")
    private String musicUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String lyrics;

    @Column(columnDefinition = "TEXT")
    private String albumCoverUrl;

    @Column(length = 100)
    private String spotifyTrackId;

    private Integer durationMs;

    private Integer popularity;

    @Column(length = 50)
    private String status;
}