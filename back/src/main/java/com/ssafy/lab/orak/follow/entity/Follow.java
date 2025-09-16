package com.ssafy.lab.orak.follow.entity;


import com.ssafy.lab.orak.profile.entity.Profile;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "follows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id", "followee_id"}))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private Profile follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private Profile following;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Follow of(Profile follower, Profile following) {
        return Follow.builder()
                .follower(follower)
                .following(following)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public boolean isSelfFollow() {
        return this.follower.getId().equals(this.following.getId());
    }

    public boolean isFollowRelation(Long followerId, Long followingId) {
        return this.follower.getId().equals(followerId) && this.following.getId().equals(followingId);
    }
}
