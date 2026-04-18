package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AdminUpdateUserRequestDTO;
import com.smartcampus.backend.dto.AdminInviteUserRequestDTO;
import com.smartcampus.backend.dto.InvitedUserResponseDTO;
import com.smartcampus.backend.dto.UserResponseDTO;
import com.smartcampus.backend.service.AdminAccessService;
import com.smartcampus.backend.service.InviteService;
import com.smartcampus.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminInviteController {

    private final AdminAccessService adminAccessService;
    private final InviteService inviteService;
    private final UserService userService;

    @PostMapping("/invite")
    public InvitedUserResponseDTO inviteUser(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody AdminInviteUserRequestDTO request
    ) {
        adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return inviteService.inviteUser(request);
    }

    @PatchMapping("/{id}")
    public UserResponseDTO updateUser(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequestDTO request
    ) {
        String reviewer = adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return userService.adminUpdateUser(id, request, reviewer);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deleteUser(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id
    ) {
        String reviewer = adminAccessService.requireAdminAndGetReviewer(oidcUser);
        userService.adminDeleteUser(id, reviewer);
        return Map.of(
                "message", "User deleted successfully",
                "hardDeleted", true,
                "id", id
        );
    }
}
