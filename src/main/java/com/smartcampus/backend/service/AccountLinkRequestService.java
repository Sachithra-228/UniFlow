package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AccountLinkRequestResponseDTO;
import com.smartcampus.backend.entity.AccountLinkRequest;
import com.smartcampus.backend.entity.AccountStatus;
import com.smartcampus.backend.entity.LinkRequestStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.AccountLinkRequestRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountLinkRequestService {

    private final AccountLinkRequestRepository accountLinkRequestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public AccountLinkRequest createPendingRequest(String googleEmail, String displayName, String googleSubject) {
        String normalizedGoogleEmail = normalizeEmail(googleEmail);

        return accountLinkRequestRepository
                .findFirstByRequestedGoogleEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
                        normalizedGoogleEmail,
                        LinkRequestStatus.PENDING
                )
                .orElseGet(() -> {
                    AccountLinkRequest created = accountLinkRequestRepository.save(
                            AccountLinkRequest.builder()
                                    .requestedGoogleEmail(normalizedGoogleEmail)
                                    .requestedDisplayName(displayName)
                                    .requestedGoogleSubject(googleSubject)
                                    .status(LinkRequestStatus.PENDING)
                                    .createdAt(LocalDateTime.now())
                                    .build()
                    );
                    emailService.notifyAdminAboutLinkRequest(normalizedGoogleEmail, displayName);
                    return created;
                });
    }

    @Transactional(readOnly = true)
    public List<AccountLinkRequestResponseDTO> getLinkRequests(String status) {
        List<AccountLinkRequest> requests;
        if (status == null || status.isBlank()) {
            requests = accountLinkRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            LinkRequestStatus parsed = LinkRequestStatus.valueOf(status.trim().toUpperCase());
            requests = accountLinkRequestRepository.findByStatusOrderByCreatedAtDesc(parsed);
        }
        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AccountLinkRequestResponseDTO approveRequest(Long requestId, Long userId, String note, String reviewerEmail) {
        AccountLinkRequest request = accountLinkRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Link request not found: " + requestId));

        if (request.getStatus() != LinkRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending link requests can be approved");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        userRepository.findByGoogleEmailIgnoreCase(request.getRequestedGoogleEmail())
                .filter(existing -> !existing.getId().equals(targetUser.getId()))
                .ifPresent(existing -> {
                    throw new IllegalStateException("Google email is already linked to another account");
                });

        targetUser.setGoogleEmail(request.getRequestedGoogleEmail());
        targetUser.setProvider("google");
        if (request.getRequestedGoogleSubject() != null && !request.getRequestedGoogleSubject().isBlank()) {
            targetUser.setProviderId(request.getRequestedGoogleSubject());
        }
        if (targetUser.getAccountStatus() == null || targetUser.getAccountStatus() == AccountStatus.INVITED) {
            targetUser.setAccountStatus(AccountStatus.ACTIVE);
            if (targetUser.getActivatedAt() == null) {
                targetUser.setActivatedAt(LocalDateTime.now());
            }
            targetUser.setInviteTokenHash(null);
            targetUser.setInviteTokenExpiresAt(null);
        }
        userRepository.save(targetUser);

        request.setStatus(LinkRequestStatus.APPROVED);
        request.setTargetUserId(targetUser.getId());
        request.setDecisionNote(note);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(reviewerEmail);
        return toResponse(accountLinkRequestRepository.save(request));
    }

    @Transactional
    public AccountLinkRequestResponseDTO rejectRequest(Long requestId, String note, String reviewerEmail) {
        AccountLinkRequest request = accountLinkRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Link request not found: " + requestId));

        if (request.getStatus() != LinkRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending link requests can be rejected");
        }

        request.setStatus(LinkRequestStatus.REJECTED);
        request.setDecisionNote(note);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(reviewerEmail);
        return toResponse(accountLinkRequestRepository.save(request));
    }

    private AccountLinkRequestResponseDTO toResponse(AccountLinkRequest request) {
        return AccountLinkRequestResponseDTO.builder()
                .id(request.getId())
                .requestedGoogleEmail(request.getRequestedGoogleEmail())
                .requestedDisplayName(request.getRequestedDisplayName())
                .requestedGoogleSubject(request.getRequestedGoogleSubject())
                .status(request.getStatus())
                .targetUserId(request.getTargetUserId())
                .decisionNote(request.getDecisionNote())
                .reviewedBy(request.getReviewedBy())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new AccessDeniedException("Google email is missing");
        }
        return email.trim().toLowerCase();
    }
}

