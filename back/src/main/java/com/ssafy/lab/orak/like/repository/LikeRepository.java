package com.ssafy.lab.orak.like.repository;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.like.entity.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndAlbumId(Long userId, Long albumId);

    Optional<Like> findByUserIdAndAlbumId(Long userID, Long albumID);

//    특정 사용자가 좋아요한 앨범 개수
    Long countByUserId(Long userId);

//    특정 사용자가 좋아요한 앨범 목록 조회
    @Query("SELECT l.album FROM Like l JOIN l.album WHERE l.userId = :userId ORDER BY l.createdAt DESC")
    Page<Album> findLikedAlbumsByUserId(@Param("userId") Long userId, Pageable pageable);

}
