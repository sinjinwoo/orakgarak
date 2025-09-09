package com.ssafy.lab.orak.recording.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;

@Entity
@Getter
public class Record {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long user_id;

    @Column(nullable = false)
    private Long song_id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String original_file_name;

    private String duration_seconds;

}
