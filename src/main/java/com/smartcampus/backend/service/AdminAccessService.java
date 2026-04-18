package com.smartcampus.backend.service;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAccessService {

    private final UserRepository userRepository;

    public String requireAdminAndGetReviewer(OidcUser oidcUser) {
        if (oidcUser == null || oidcUser.getEmail() == null || oidcUser.getEmail().isBlank()) {
            throw new AccessDeniedException("Authenticated user email is required");
        }

        String principalEmail = oidcUser.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(principalEmail)
                .or(() -> userRepository.findByGoogleEmailIgnoreCase(principalEmail))
                .orElseThrow(() -> new AccessDeniedException("Authenticated user is not registered"));

        UserRole role = UserRole.from(user.getRole());
        if (role != UserRole.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }
        return principalEmail;
    }
}

