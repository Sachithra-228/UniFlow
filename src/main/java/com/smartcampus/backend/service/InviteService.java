package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ActivationRequestDTO;
import com.smartcampus.backend.dto.AdminInviteUserRequestDTO;
import com.smartcampus.backend.dto.InvitedUserResponseDTO;
import com.smartcampus.backend.entity.AccountStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InviteService {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.invite.activation-path:/activate}")
    private String activationPath;

    @Value("${app.invite.activation-token-hours:48}")
    private long tokenValidityHours;

    @Value("${app.invite.require-email-delivery:false}")
    private boolean requireEmailDelivery;

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public InvitedUserResponseDTO inviteUser(AdminInviteUserRequestDTO request) {
        String officialEmail = normalizeEmail(request.getEmail());
        String displayName = request.getName().trim();
        UserRole role = UserRole.from(request.getRole());

        User existingOfficialUser = userRepository.findByEmailIgnoreCase(officialEmail).orElse(null);
        if (existingOfficialUser != null) {
            return handleExistingOfficialUser(existingOfficialUser, displayName, role);
        }

        if (userRepository.existsByGoogleEmailIgnoreCase(officialEmail)) {
            throw new IllegalArgumentException("This email is already linked to another account");
        }

        User user = User.builder()
                .email(officialEmail)
                .name(displayName)
                .role(role.name())
                .password(null)
                .provider("local")
                .createdAt(LocalDateTime.now())
                .accountStatus(AccountStatus.INVITED)
                .build();

        return issueInvite(user);
    }

    private InvitedUserResponseDTO handleExistingOfficialUser(User user, String displayName, UserRole role) {
        user.setName(displayName);
        user.setRole(role.name());

        if (user.getAccountStatus() == AccountStatus.INVITED) {
            return issueInvite(user);
        }

        if (user.getAccountStatus() == null) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        }

        User saved = userRepository.save(user);
        return toInvitedUserResponse(saved, null, null, "User already existed; profile details were updated.");
    }

    private InvitedUserResponseDTO issueInvite(User user) {
        String rawInviteToken = tokenService.generateUrlSafeToken();
        String hashedInviteToken = tokenService.sha256(rawInviteToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(tokenValidityHours);

        user.setAccountStatus(AccountStatus.INVITED);
        user.setActivatedAt(null);
        user.setInviteTokenHash(hashedInviteToken);
        user.setInviteTokenExpiresAt(expiresAt);

        if (user.getProvider() == null || user.getProvider().isBlank()) {
            user.setProvider("local");
        }
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }

        User saved = userRepository.save(user);

        String activationLink = buildActivationLink(rawInviteToken);
        boolean invitationEmailSent = true;
        String message = "Invitation created and email sent successfully.";
        String responseActivationLink = null;

        try {
            emailService.sendInvitationEmail(saved.getEmail(), saved.getName(), activationLink);
        } catch (Exception ex) {
            invitationEmailSent = false;
            String reason = ex.getMessage() == null ? "unknown error" : ex.getMessage();
            message = "Invitation created, but email delivery failed (" + reason + "). Share activation link manually.";
            responseActivationLink = activationLink;
            if (requireEmailDelivery) {
                throw new IllegalStateException("Invitation email could not be sent. Check mail server configuration.", ex);
            }
        }

        return toInvitedUserResponse(saved, invitationEmailSent, responseActivationLink, message);
    }

    private InvitedUserResponseDTO toInvitedUserResponse(
            User user,
            Boolean invitationEmailSent,
            String activationLink,
            String message
    ) {
        return InvitedUserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .inviteTokenExpiresAt(user.getInviteTokenExpiresAt())
                .invitationEmailSent(invitationEmailSent)
                .activationLink(activationLink)
                .message(message)
                .build();
    }

    @Transactional
    public Map<String, Object> activateAccount(ActivationRequestDTO request) {
        String hashedToken = tokenService.sha256(request.getToken().trim());

        User user = userRepository.findByInviteTokenHashAndInviteTokenExpiresAtAfter(hashedToken, LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired activation token"));

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setActivatedAt(LocalDateTime.now());
        user.setInviteTokenHash(null);
        user.setInviteTokenExpiresAt(null);
        if (user.getProvider() == null || user.getProvider().isBlank()) {
            user.setProvider("local");
        }

        User saved = userRepository.save(user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Account activated successfully");
        response.put("id", saved.getId());
        response.put("email", saved.getEmail());
        response.put("role", saved.getRole());
        response.put("accountStatus", saved.getAccountStatus());
        return response;
    }

    private String buildActivationLink(String rawToken) {
        String normalizedPath = activationPath.startsWith("/") ? activationPath : "/" + activationPath;
        return frontendUrl + normalizedPath + "?token=" + rawToken;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase();
    }
}
