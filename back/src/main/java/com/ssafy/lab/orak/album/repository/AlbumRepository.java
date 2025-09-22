package com.ssafy.lab.orak.album.repository;

import com.ssafy.lab.orak.album.entity.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

//    전체 앨범 조회
    Page<Album> findAllByOrderByCreatedAtDesc(Pageable pageable);

//    공개 앨범 조회 (키워드 없음)
    Page<Album> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);

//    공개 앨범 검색 조회 (키워드 있음)
    @Query("SELECT a FROM Album a WHERE a.isPublic = true AND (a.title LIKE %:keyword% OR a.description LIKE %:keyword%) ORDER BY a.createdAt DESC")
    Page<Album> findPublicAlbumsByKeyword(@Param("keyword") String keyword, Pageable pageable);

//    특정 사용자의 앨범 개수 조회
    Long countByUserId(Long userId);

//    특정 사용자의 앨범 목록 조회 (최신순)
    Page<Album> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

//    팔로우한 사용자의 공개 앨범 조회
    @Query("SELECT a FROM Album a " +
           "JOIN Follow f ON a.userId = f.following.id " +
           "WHERE f.follower.id = :currentUserId AND a.isPublic = true " +
           "ORDER BY a.createdAt DESC")
    Page<Album> findPublicAlbumsByFollowedUsers(@Param("currentUserId") Long currentUserId, Pageable pageable);

//    팔로우한 사용자의 공개 앨범 검색 조회 (키워드 있음)
    @Query("SELECT a FROM Album a " +
           "JOIN Follow f ON a.userId = f.following.id " +
           "WHERE f.follower.id = :currentUserId AND a.isPublic = true " +
           "AND (a.title LIKE %:keyword% OR a.description LIKE %:keyword%) " +
           "ORDER BY a.createdAt DESC")
    Page<Album> findPublicAlbumsByFollowedUsersAndKeyword(@Param("currentUserId") Long currentUserId,
                                                          @Param("keyword") String keyword,
                                                          Pageable pageable);

}