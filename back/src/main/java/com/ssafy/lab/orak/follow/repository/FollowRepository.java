package com.ssafy.lab.orak.follow.repository;

import com.ssafy.lab.orak.follow.entity.Follow;
import com.ssafy.lab.orak.profile.entity.Profile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    // User ID 기반으로 팔로우 관계 확인
    @Query("SELECT COUNT(f) > 0 FROM Follow f WHERE f.follower.user.id = :followerId AND f.following.user.id = :followingId")
    boolean existsByFollowerUserIdAndFollowingUserId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Query("SELECT f FROM Follow f WHERE f.follower.user.id = :followerId AND f.following.user.id = :followingId")
    Optional<Follow> findByFollowerUserIdAndFollowingUserId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    // 기존 Profile ID 기반 메서드들 (호환성 유지)
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
//    팔로잉 목록 조회 (내가 팔로우하는 사람들)
    @Query("SELECT f FROM Follow f " +
            "JOIN FETCH f.following " +
            "WHERE f.follower.id = :userId " +
            "ORDER BY f.createdAt DESC")
    Page<Follow> findFollowingByFollowerId(@Param("userId") Long userId, Pageable pageable);

//    팔로워 목록 조회 (나를 팔로우하는 사람들)
    @Query("SELECT f FROM Follow f " +
            "JOIN FETCH f.follower " +
            "WHERE f.following.id = :userId " +
            "ORDER BY f.createdAt DESC")
    Page<Follow> findFollowerByFollowingId(@Param("userId") Long userId, Pageable pageable);
//    User ID 기반 팔로우 수 조회
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following.user.id = :userId")
    long countByFollowingUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(f) FROM Follow f WHERE f.follower.user.id = :userId")
    long countByFollowerUserId(@Param("userId") Long userId);

//    Profile ID 기반 팔로우 수 조회 (기존)
    long countByFollowingId(Long followingId);
//    팔로잉 수 조회
    long countByFollowerId(Long followerId);

//    맞팔로우 확인 처리
    @Query("SELECT count(f) FROM Follow f " +
            "WHERE (f.follower.id = :userId1 AND f.following.id = :userId2) " +
            "OR (f.follower.id = :userId2 AND f.following.id = :userId1)")
    long countMutualFollow(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

//    특정 프로필을 팔로우하는 사람 수 (팔로워 수)
    Long countByFollowing(Profile profile);

//    특정 프로필이 팔로우하는 사람 수 (팔로잉 수)
    Long countByFollower(Profile profile);
}
