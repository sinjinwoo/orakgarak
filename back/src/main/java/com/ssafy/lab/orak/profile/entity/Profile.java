package com.ssafy.lab.orak.profile.entity;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "profiles")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Profile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Back-reference to User (mapped by profile field in User entity)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    // S3 key path to the profile image stored in S3
    @Column(name = "profile_image_s3_key")
    private String profileImageS3Key;

    // User nickname
    @Column(name = "nickname", length = 50)
    private String nickname;

    // Gender of the user (free-form to keep it simple; can be converted to ENUM later)
    @Column(name = "gender")
    private String gender;

    // Self description or bio
    @Column(name = "description", length = 1000)
    private String description;

    // Domain update method: apply changes only when provided (null or blank = keep existing)
    public void update(String profileImageS3Key, String nickname, String gender, String description) {
        if (profileImageS3Key != null && !profileImageS3Key.isBlank()) {
            this.profileImageS3Key = profileImageS3Key;
        }
        if (nickname != null && !nickname.isBlank()) {
            this.nickname = nickname;
        }
        if (gender != null && !gender.isBlank()) {
            this.gender = gender;
        }
        if (description != null && !description.isBlank()) {
            this.description = description;
        }
    }
}
