package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ActivationRequestDTO;
import com.smartcampus.backend.dto.ProfileUpdateRequestDTO;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.service.InviteService;
import com.smartcampus.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final InviteService inviteService;

    @GetMapping("/")
    public String home() {
        return "Smart Campus backend running";
    }

    @GetMapping("/profile")
    public Map<String, Object> profile(@AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.resolveGoogleUser(oidcUser);
        return mapProfileResponse(user);
    }

    @PatchMapping("/profile")
    public Map<String, Object> updateProfile(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody ProfileUpdateRequestDTO request
    ) {
        User user = userService.updateOwnProfile(oidcUser, request);
        return mapProfileResponse(user);
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfilePut(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody ProfileUpdateRequestDTO request
    ) {
        User user = userService.updateOwnProfile(oidcUser, request);
        return mapProfileResponse(user);
    }

    private Map<String, Object> mapProfileResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("role", UserRole.from(user.getRole()).name());
        response.put("provider", user.getProvider());
        response.put("providerId", user.getProviderId());
        return response;
    }

    @PostMapping("/api/auth/activate")
    public Map<String, Object> activate(@Valid @RequestBody ActivationRequestDTO request) {
        return inviteService.activateAccount(request);
    }
}
