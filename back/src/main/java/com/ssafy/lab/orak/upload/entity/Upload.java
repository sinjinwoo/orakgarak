package com.ssafy.lab.orak.upload.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "uploads")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Upload extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String originalFilename;
    
    @Column(nullable = false)
    private String uuid;
    
    @Column(nullable = false)
    private String extension;
    
    @Column(nullable = false)
    private Long uploaderId;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(nullable = false)
    private String directory;
    
    // 편의 메서드: 저장된 파일명 생성
    public String getStoredFilename() {
        return uuid + "_" + originalFilename + "." + extension;
    }
    
    // 편의 메서드: 전체 파일 경로 생성
    public String getFullPath() {
        return directory + "/" + getStoredFilename();
    }

}