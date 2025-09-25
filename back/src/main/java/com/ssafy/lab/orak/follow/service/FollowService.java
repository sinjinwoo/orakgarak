package com.ssafy.lab.orak.follow.service;

import com.ssafy.lab.orak.profile.entity.Profile;
import com.ssafy.lab.orak.profile.repository.ProfileRepository;
import com.ssafy.lab.orak.follow.dto.FollowDto;
import com.ssafy.lab.orak.follow.entity.Follow;
import com.ssafy.lab.orak.follow.repository.FollowRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final ProfileRepository profileRepository;

    /**
     * 팔로우 토글 (팔로우/언팔로우)
     * @param followerId 팔로우하는 사용자 ID
     * @param followingId 팔로우당하는 사용자 ID
     * @return true: 팔로우됨, false: 언팔로우됨
     */
    @Transactional
    public boolean toggleFollow(Long followerId, Long followingId) {
        // 자기 자신을 팔로우하는 경우 예외 처리
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        // 이미 팔로우 중인지 확인 (User ID 기반)
        if (followRepository.existsByFollowerUserIdAndFollowingUserId(followerId, followingId)) {
            // 이미 팔로우 중이면 언팔로우
            Follow follow = followRepository.findByFollowerUserIdAndFollowingUserId(followerId, followingId)
                    .orElseThrow(() -> new IllegalArgumentException("팔로우 관계가 존재하지 않습니다."));
            followRepository.delete(follow);
            log.info("사용자 언팔로우 완료: follower={}, following={}", followerId, followingId);
            return false;
        } else {
            // 팔로우하지 않았다면 팔로우
            Profile follower = profileRepository.findByUser_Id(followerId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. User ID: " + followerId));
            Profile following = profileRepository.findByUser_Id(followingId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. User ID: " + followingId));

            Follow follow = Follow.of(follower, following);
            followRepository.save(follow);
            log.info("사용자 팔로우 완료: follower={}, following={}", followerId, followingId);
            return true;
        }
    }

    /**
     * 사용자 팔로우
     * @param followerId 팔로우하는 사용자 ID
     * @param followingId 팔로우당하는 사용자 ID
     */
    @Transactional
    public void followUser(Long followerId, Long followingId) {
        // 자기 자신을 팔로우하는 경우 예외 처리
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        // 이미 팔로우 중인지 확인 (User ID 기반)
        if (followRepository.existsByFollowerUserIdAndFollowingUserId(followerId, followingId)) {
            throw new IllegalStateException("이미 팔로우한 사용자입니다.");
        }

        // User ID로 프로필 조회
        Profile follower = profileRepository.findByUser_Id(followerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. User ID: " + followerId));
        Profile following = profileRepository.findByUser_Id(followingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. User ID: " + followingId));

        // 팔로우 관계 생성
        Follow follow = Follow.of(follower, following);
        followRepository.save(follow);

        log.info("사용자 팔로우 완료: follower={}, following={}", followerId, followingId);
    }

    /**
     * 사용자 언팔로우
     * @param followerId 언팔로우하는 사용자 ID
     * @param followingId 언팔로우당하는 사용자 ID
     */
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        Follow follow = followRepository.findByFollowerUserIdAndFollowingUserId(followerId, followingId)
                .orElseThrow(() -> new IllegalArgumentException("팔로우 관계가 존재하지 않습니다."));

        followRepository.delete(follow);
        log.info("사용자 언팔로우 완료: follower={}, following={}", followerId, followingId);
    }

    /**
     * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
     * @param userId 사용자 ID
     * @param pageable 페이지네이션 정보
     * @return 팔로잉 목록
     */
    public Page<FollowDto.UserResponse> getFollowing(Long userId, Pageable pageable) {
        Page<Follow> follows = followRepository.findFollowingByFollowerId(userId, pageable);

        return follows.map(follow -> {
            Profile following = follow.getFollowing();
            boolean isFollowingBack = followRepository.existsByFollowerIdAndFollowingId(
                    following.getId(), userId);

            return FollowDto.UserResponse.builder()
                    .userId(following.getId())
                    .nickname(following.getNickname())
                    .email(following.getUser().getEmail())
                    .followedAt(follow.getCreatedAt())
                    .isFollowingBack(isFollowingBack)
                    .build();
        });
    }

    /**
     * 팔로워 목록 조회 (나를 팔로우하는 사람들)
     * @param userId 사용자 ID
     * @param pageable 페이지네이션 정보
     * @return 팔로워 목록
     */
    public Page<FollowDto.UserResponse> getFollowers(Long userId, Pageable pageable) {
        Page<Follow> follows = followRepository.findFollowerByFollowingId(userId, pageable);

        return follows.map(follow -> {
            Profile follower = follow.getFollower();
            boolean isFollowingBack = followRepository.existsByFollowerIdAndFollowingId(
                    userId, follower.getId());

            return FollowDto.UserResponse.builder()
                    .userId(follower.getId())
                    .nickname(follower.getNickname())
                    .email(follower.getUser().getEmail())
                    .followedAt(follow.getCreatedAt())
                    .isFollowingBack(isFollowingBack)
                    .build();
        });
    }

    /**
     * 팔로우 여부 확인
     * @param followerId 팔로우하는 사용자 ID
     * @param followingId 팔로우당하는 사용자 ID
     * @return 팔로우 여부
     */
    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowerUserIdAndFollowingUserId(followerId, followingId);
    }

    /**
     * 팔로워 수 조회 (User ID 기반)
     * @param userId 사용자 ID
     * @return 팔로워 수
     */
    public long getFollowerCount(Long userId) {
        return followRepository.countByFollowingUserId(userId);
    }

    /**
     * 팔로잉 수 조회 (User ID 기반)
     * @param userId 사용자 ID
     * @return 팔로잉 수
     */
    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerUserId(userId);
    }
}