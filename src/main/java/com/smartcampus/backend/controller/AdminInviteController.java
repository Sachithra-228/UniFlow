package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AdminInviteUserRequestDTO;
import com.smartcampus.backend.dto.InvitedUserResponseDTO;
import com.smartcampus.backend.service.AdminAccessService;
import com.smartcampus.backend.service.InviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminInviteController {

    private final AdminAccessService adminAccessService;
    private final InviteService inviteService;

    @PostMapping("/invite")
    public InvitedUserResponseDTO inviteUser(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody AdminInviteUserRequestDTO request
    ) {
        adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return inviteService.inviteUser(request);
    }
}

