package com.ssafy.lab.orak.upload.repository;

import com.ssafy.lab.orak.upload.entity.Upload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UploadRepository extends JpaRepository<Upload, Long> {
}