package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.TicketAssignRequestDTO;
import com.smartcampus.backend.dto.TicketResponseDTO;
import com.smartcampus.backend.entity.TicketStatus;
import com.smartcampus.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
public class AdminTicketController {

    private final TicketService ticketService;

    @GetMapping
    public Page<TicketResponseDTO> listAllTickets(
            @AuthenticationPrincipal OidcUser oidcUser,
            @RequestParam(required = false) TicketStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ticketService.listAllTickets(oidcUser, status, pageable);
    }

    @PatchMapping("/{id}/assign")
    public TicketResponseDTO assignTechnician(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody TicketAssignRequestDTO requestDTO
    ) {
        return ticketService.assignTechnician(oidcUser, id, requestDTO);
    }
}

