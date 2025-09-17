package com.ssafy.lab.orak.like.repository;

import com.ssafy.lab.orak.like.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndAlbumId(Long userId, Long albumId);

    Optional<Like> findByUserIdAndAlbumId(Long userID, Long albumID);

}
