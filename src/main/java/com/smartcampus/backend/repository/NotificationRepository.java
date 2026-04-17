package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    boolean existsByUserIdOrRecipientId(Long userId, Long recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from Notification n
            where n.user.id = :userId
               or n.recipient.id = :recipientId
            """)
    int deleteByUserIdOrRecipientId(@Param("userId") Long userId, @Param("recipientId") Long recipientId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadStatusOrderByCreatedAtDesc(Long userId, boolean readStatus, Pageable pageable);

    List<Notification> findByUserIdAndReadStatus(Long userId, boolean readStatus);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);
}
