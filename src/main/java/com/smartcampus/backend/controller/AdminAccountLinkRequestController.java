package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AccountLinkDecisionRequestDTO;
import com.smartcampus.backend.dto.AccountLinkRejectRequestDTO;
import com.smartcampus.backend.dto.AccountLinkRequestResponseDTO;
import com.smartcampus.backend.service.AccountLinkRequestService;
import com.smartcampus.backend.service.AdminAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/link-requests")
@RequiredArgsConstructor
public class AdminAccountLinkRequestController {

    private final AdminAccessService adminAccessService;
    private final AccountLinkRequestService accountLinkRequestService;

    @GetMapping
    public List<AccountLinkRequestResponseDTO> listLinkRequests(
            @AuthenticationPrincipal OidcUser oidcUser,
            @RequestParam(required = false) String status
    ) {
        adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return accountLinkRequestService.getLinkRequests(status);
    }

    @PostMapping("/{id}/approve")
    public AccountLinkRequestResponseDTO approveLinkRequest(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody AccountLinkDecisionRequestDTO request
    ) {
        String reviewer = adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return accountLinkRequestService.approveRequest(id, request.getUserId(), request.getNote(), reviewer);
    }

    @PostMapping("/{id}/reject")
    public AccountLinkRequestResponseDTO rejectLinkRequest(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody AccountLinkRejectRequestDTO request
    ) {
        String reviewer = adminAccessService.requireAdminAndGetReviewer(oidcUser);
        return accountLinkRequestService.rejectRequest(id, request.getNote(), reviewer);
    }
}

