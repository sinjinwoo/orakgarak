package com.ssafy.lab.orak.album.repository;

import com.ssafy.lab.orak.album.entity.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

//    전체 앨범 조회
    Page<Album> findAllByOrderByCreatedAtDesc(Pageable pageable);
}