package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.AccountLinkRequest;
import com.smartcampus.backend.entity.LinkRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountLinkRequestRepository extends JpaRepository<AccountLinkRequest, Long> {

    boolean existsByTargetUserId(Long targetUserId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from AccountLinkRequest ar where ar.targetUserId = :targetUserId")
    int deleteByTargetUserId(@Param("targetUserId") Long targetUserId);

    List<AccountLinkRequest> findByStatusOrderByCreatedAtDesc(LinkRequestStatus status);

    List<AccountLinkRequest> findAllByOrderByCreatedAtDesc();

    Optional<AccountLinkRequest> findFirstByRequestedGoogleEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String requestedGoogleEmail,
            LinkRequestStatus status
    );
}
