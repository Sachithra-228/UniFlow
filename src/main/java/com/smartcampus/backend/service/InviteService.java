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

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public InvitedUserResponseDTO inviteUser(AdminInviteUserRequestDTO request) {
        String officialEmail = normalizeEmail(request.getEmail());
        UserRole role = UserRole.from(request.getRole());

        if (userRepository.existsByEmailIgnoreCase(officialEmail)) {
            throw new IllegalStateException("A user with this email already exists");
        }
        if (userRepository.existsByGoogleEmailIgnoreCase(officialEmail)) {
            throw new IllegalStateException("This email is already linked as a Google account");
        }

        String rawInviteToken = tokenService.generateUrlSafeToken();
        String hashedInviteToken = tokenService.sha256(rawInviteToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(tokenValidityHours);

        User user = userRepository.save(
                User.builder()
                        .email(officialEmail)
                        .name(request.getName().trim())
                        .role(role.name())
                        .password(null)
                        .provider("local")
                        .createdAt(LocalDateTime.now())
                        .accountStatus(AccountStatus.INVITED)
                        .inviteTokenHash(hashedInviteToken)
                        .inviteTokenExpiresAt(expiresAt)
                        .build()
        );

        String activationLink = buildActivationLink(rawInviteToken);
        emailService.sendInvitationEmail(user.getEmail(), user.getName(), activationLink);

        return InvitedUserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .inviteTokenExpiresAt(user.getInviteTokenExpiresAt())
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

