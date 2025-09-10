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
    private String storedFilename;

    @Column(nullable = false)
    private Long fileSize;
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(nullable = false)
    private String directory;

}