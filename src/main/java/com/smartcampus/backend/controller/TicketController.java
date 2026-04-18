package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.TicketCommentRequestDTO;
import com.smartcampus.backend.dto.TicketCommentResponseDTO;
import com.smartcampus.backend.dto.TicketCommentUpdateRequestDTO;
import com.smartcampus.backend.dto.TicketCreateRequestDTO;
import com.smartcampus.backend.dto.TicketResolutionRequestDTO;
import com.smartcampus.backend.dto.TicketResponseDTO;
import com.smartcampus.backend.dto.TicketStatusUpdateRequestDTO;
import com.smartcampus.backend.dto.TicketVisitEventCreateRequestDTO;
import com.smartcampus.backend.dto.TicketVisitEventResponseDTO;
import com.smartcampus.backend.dto.TicketVisitTimelineResponseDTO;
import com.smartcampus.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TicketResponseDTO createTicket(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @ModelAttribute TicketCreateRequestDTO requestDTO
    ) {
        return ticketService.createTicket(oidcUser, requestDTO);
    }

    @GetMapping("/my")
    public Page<TicketResponseDTO> listMyTickets(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ticketService.listMyTickets(oidcUser, pageable);
    }

    @GetMapping("/assigned")
    public Page<TicketResponseDTO> listAssignedTickets(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ticketService.listAssignedTickets(oidcUser, pageable);
    }

    @GetMapping("/assigned/visits")
    public List<TicketVisitTimelineResponseDTO> listAssignedVisitTimelines(
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ticketService.listAssignedVisitTimelines(oidcUser);
    }

    @PatchMapping("/{id}/status")
    public TicketResponseDTO updateStatus(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateRequestDTO requestDTO
    ) {
        return ticketService.updateStatus(oidcUser, id, requestDTO);
    }

    @PatchMapping("/{id}/resolution")
    public TicketResponseDTO addResolutionNotes(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody TicketResolutionRequestDTO requestDTO
    ) {
        return ticketService.addResolutionNotes(oidcUser, id, requestDTO);
    }

    @PostMapping("/{id}/comments")
    public TicketCommentResponseDTO addComment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody TicketCommentRequestDTO requestDTO
    ) {
        return ticketService.addComment(oidcUser, id, requestDTO);
    }

    @PostMapping("/{id}/visits")
    public TicketVisitEventResponseDTO addVisitEvent(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody TicketVisitEventCreateRequestDTO requestDTO
    ) {
        return ticketService.addVisitEvent(oidcUser, id, requestDTO);
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public TicketCommentResponseDTO updateComment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody TicketCommentUpdateRequestDTO requestDTO
    ) {
        return ticketService.updateComment(oidcUser, ticketId, commentId, requestDTO);
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long ticketId,
            @PathVariable Long commentId
    ) {
        ticketService.deleteComment(oidcUser, ticketId, commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId
    ) {
        TicketService.AttachmentDownload download = ticketService.downloadAttachment(oidcUser, ticketId, attachmentId);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (download.contentType() != null && !download.contentType().isBlank()) {
            mediaType = MediaType.parseMediaType(download.contentType());
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.fileName() + "\"")
                .body(download.resource());
    }
}
