package com.ssafy.lab.orak.profile.entity;

import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.upload.entity.Upload;
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

    // Profile image upload reference
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_image_upload_id")
    private Upload profileImageUpload;

    // Background image upload reference
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "background_image_upload_id")
    private Upload backgroundImageUpload;


    // User nickname
    @Column(name = "nickname", length = 50, unique = true)
    private String nickname;

    // Gender of the user (free-form to keep it simple; can be converted to ENUM later)
    @Column(name = "gender")
    private String gender;

    // Self description or bio
    @Column(name = "description", length = 1000)
    private String description;

    // Domain update method: apply changes only when provided (null or blank = keep existing)
    public void update(Upload profileImageUpload, String nickname, String gender, String description) {
        if (profileImageUpload != null) {
            this.profileImageUpload = profileImageUpload;
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

    // Update background image
    public void updateBackgroundImage(Upload backgroundImageUpload) {
        this.backgroundImageUpload = backgroundImageUpload;
    }
}
