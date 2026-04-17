package com.smartcampus.backend.service;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User requireCurrentUser(OidcUser oidcUser) {
        if (oidcUser == null || oidcUser.getEmail() == null || oidcUser.getEmail().isBlank()) {
            throw new AccessDeniedException("Authenticated user email is required");
        }

        String principalEmail = oidcUser.getEmail().trim().toLowerCase();
        return userRepository.findByEmailIgnoreCase(principalEmail)
                .or(() -> userRepository.findByGoogleEmailIgnoreCase(principalEmail))
                .orElseThrow(() -> new AccessDeniedException("Authenticated user is not registered"));
    }

    public UserRole roleOf(User user) {
        return UserRole.from(user.getRole());
    }

    public void requireAnyRole(User user, UserRole... allowedRoles) {
        UserRole actual = roleOf(user);
        boolean matched = Arrays.stream(allowedRoles).anyMatch(role -> role == actual);
        if (!matched) {
            throw new AccessDeniedException("Insufficient role permissions");
        }
    }

    public boolean isAdmin(User user) {
        return roleOf(user) == UserRole.ADMIN;
    }
}

