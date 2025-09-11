package com.ssafy.lab.orak.recording.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.upload.entity.Upload;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
}
