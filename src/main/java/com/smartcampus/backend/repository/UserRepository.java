package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleEmailIgnoreCase(String googleEmail);

    Optional<User> findByInviteTokenHashAndInviteTokenExpiresAtAfter(String inviteTokenHash, java.time.LocalDateTime now);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByGoogleEmailIgnoreCase(String googleEmail);
}
