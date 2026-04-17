package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.AccountLinkRequest;
import com.smartcampus.backend.entity.LinkRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountLinkRequestRepository extends JpaRepository<AccountLinkRequest, Long> {

    List<AccountLinkRequest> findByStatusOrderByCreatedAtDesc(LinkRequestStatus status);

    List<AccountLinkRequest> findAllByOrderByCreatedAtDesc();

    Optional<AccountLinkRequest> findFirstByRequestedGoogleEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String requestedGoogleEmail,
            LinkRequestStatus status
    );
}

