package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AdminUpdateUserRequestDTO;
import com.smartcampus.backend.dto.ProfileUpdateRequestDTO;
import com.smartcampus.backend.dto.UserResponseDTO;
import com.smartcampus.backend.entity.AccountStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.AccountLinkRequestRepository;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.TicketCommentRepository;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AccountLinkRequestService accountLinkRequestService;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final NotificationRepository notificationRepository;
    private final AccountLinkRequestRepository accountLinkRequestRepository;

    public Page<UserResponseDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserResponse);
    }

    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toUserResponse(user);
    }

    @Transactional
    public User updateOwnProfile(OidcUser oidcUser, ProfileUpdateRequestDTO request) {
        User user = resolveGoogleUser(oidcUser);
        user.setName(request.getName().trim());
        return userRepository.save(user);
    }

    @Transactional
    public UserResponseDTO adminUpdateUser(Long id, AdminUpdateUserRequestDTO request, String reviewerEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (reviewerEmail != null && reviewerEmail.equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("You cannot modify your own admin account from this screen");
        }

        user.setName(request.getName().trim());
        user.setRole(UserRole.from(request.getRole()).name());
        if (request.getAccountStatus() != null) {
            user.setAccountStatus(request.getAccountStatus());
        } else if (user.getAccountStatus() == null) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        }

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Transactional
    public boolean adminDeleteUser(Long id, String reviewerEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (reviewerEmail != null && reviewerEmail.equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("You cannot delete your own admin account");
        }

        UserRole role = UserRole.from(user.getRole());
        if (role == UserRole.ADMIN && userRepository.findByRoleIgnoreCase(UserRole.ADMIN.name()).size() <= 1) {
            throw new IllegalArgumentException("At least one admin account must remain in the system");
        }

        deleteDependentDataForUser(id);
        userRepository.flush();
        userRepository.delete(user);
        userRepository.flush();
        return true;
    }

    private void deleteDependentDataForUser(Long userId) {
        accountLinkRequestRepository.deleteByTargetUserId(userId);
        notificationRepository.deleteByUserIdOrRecipientId(userId, userId);

        // Remove comments authored by user on other users' tickets.
        ticketCommentRepository.deleteByAuthorId(userId);

        // Unassign technician references first to preserve tickets that belong to other users.
        ticketRepository.clearAssignedTechnicianReferences(userId);

        // Delete tickets created by this user (attachments/comments are removed via cascade).
        var createdTickets = ticketRepository.findAllByCreatedById(userId);
        if (!createdTickets.isEmpty()) {
            ticketRepository.deleteAll(createdTickets);
        }

        bookingRepository.deleteByUserId(userId);
    }

    @Transactional
    public User resolveGoogleUser(OidcUser oidcUser) {
        String googleEmail = normalizeGoogleEmail(oidcUser);
        String displayName = oidcUser.getFullName();
        String googleSubject = oidcUser.getSubject();

        User officialEmailMatch = userRepository.findByEmailIgnoreCase(googleEmail).orElse(null);
        if (officialEmailMatch != null) {
            applyGoogleLink(officialEmailMatch, googleEmail, googleSubject, displayName);
            return userRepository.save(officialEmailMatch);
        }

        User approvedLinkedMatch = userRepository.findByGoogleEmailIgnoreCase(googleEmail).orElse(null);
        if (approvedLinkedMatch != null) {
            applyGoogleLink(approvedLinkedMatch, googleEmail, googleSubject, displayName);
            return userRepository.save(approvedLinkedMatch);
        }

        accountLinkRequestService.createPendingRequest(googleEmail, displayName, googleSubject);
        throw new AccessDeniedException("Google account is not linked to an invited identity yet");
    }

    private void applyGoogleLink(User user, String googleEmail, String googleSubject, String displayName) {
        if ((user.getName() == null || user.getName().isBlank()) && displayName != null && !displayName.isBlank()) {
            user.setName(displayName);
        }

        user.setProvider("google");
        user.setProviderId(googleSubject);

        if (user.getGoogleEmail() == null || user.getGoogleEmail().isBlank()) {
            user.setGoogleEmail(googleEmail);
        }

        if (user.getAccountStatus() == null || user.getAccountStatus() == AccountStatus.INVITED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setActivatedAt(LocalDateTime.now());
            user.setInviteTokenHash(null);
            user.setInviteTokenExpiresAt(null);
        }
    }

    private UserResponseDTO toUserResponse(User user) {
        String normalizedRole = UserRole.from(user.getRole()).name();
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(normalizedRole)
                .createdAt(user.getCreatedAt())
                .providerId(user.getProviderId())
                .provider(user.getProvider())
                .googleEmail(user.getGoogleEmail())
                .accountStatus(user.getAccountStatus())
                .activatedAt(user.getActivatedAt())
                .build();
    }

    private String normalizeGoogleEmail(OidcUser oidcUser) {
        if (oidcUser == null || oidcUser.getEmail() == null || oidcUser.getEmail().isBlank()) {
            throw new AccessDeniedException("Google profile did not contain a valid email");
        }
        return oidcUser.getEmail().trim().toLowerCase();
    }
}
