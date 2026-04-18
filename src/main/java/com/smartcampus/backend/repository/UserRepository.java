package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleEmailIgnoreCase(String googleEmail);

    Optional<User> findByInviteTokenHashAndInviteTokenExpiresAtAfter(String inviteTokenHash, java.time.LocalDateTime now);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByGoogleEmailIgnoreCase(String googleEmail);

    List<User> findByRoleIgnoreCase(String role);

    @Query("select u from User u where u.accountStatus is null or u.accountStatus <> :status")
    Page<User> findDirectoryUsersExcludingStatus(@Param("status") AccountStatus status, Pageable pageable);
}
