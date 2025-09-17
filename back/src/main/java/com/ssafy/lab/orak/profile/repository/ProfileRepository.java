package com.ssafy.lab.orak.profile.repository;

import com.ssafy.lab.orak.profile.entity.Profile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByUser_Id(Long userId);

    boolean existsByNickname(String nickname);

}
