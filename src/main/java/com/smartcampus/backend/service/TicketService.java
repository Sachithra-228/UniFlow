package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.TicketAssignRequestDTO;
import com.smartcampus.backend.dto.TicketAttachmentResponseDTO;
import com.smartcampus.backend.dto.TicketCommentRequestDTO;
import com.smartcampus.backend.dto.TicketCommentResponseDTO;
import com.smartcampus.backend.dto.TicketCommentUpdateRequestDTO;
import com.smartcampus.backend.dto.TicketCreateRequestDTO;
import com.smartcampus.backend.dto.TicketResolutionRequestDTO;
import com.smartcampus.backend.dto.TicketResponseDTO;
import com.smartcampus.backend.dto.TicketStatusUpdateRequestDTO;
import com.smartcampus.backend.dto.TicketUpdateRequestDTO;
import com.smartcampus.backend.entity.Resource;
import com.smartcampus.backend.entity.Ticket;
import com.smartcampus.backend.entity.TicketAttachment;
import com.smartcampus.backend.entity.TicketComment;
import com.smartcampus.backend.entity.TicketStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.TicketAttachmentRepository;
import com.smartcampus.backend.repository.TicketCommentRepository;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final CurrentUserService currentUserService;
    private final TicketAttachmentStorageService ticketAttachmentStorageService;
    private final NotificationService notificationService;

    @Transactional
    public TicketResponseDTO createTicket(OidcUser oidcUser, TicketCreateRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.STUDENT, UserRole.STAFF, UserRole.ADMIN);

        validateResourceOrLocation(requestDTO);

        Resource resource = null;
        if (requestDTO.getResourceId() != null) {
            resource = resourceRepository.findById(requestDTO.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", requestDTO.getResourceId()));
        }
        String normalizedLocation = normalizeOptional(requestDTO.getLocationReference());
        if (normalizedLocation == null && resource != null) {
            normalizedLocation = normalizeOptional(resource.getLocation());
        }
        if (normalizedLocation == null) {
            throw new IllegalArgumentException("Location is required when selected resource has no location.");
        }

        Ticket ticket = Ticket.builder()
                .resource(resource)
                .locationReference(normalizedLocation)
                .legacyLocation(normalizedLocation)
                .category(requestDTO.getCategory())
                .description(requestDTO.getDescription().trim())
                .priority(requestDTO.getPriority())
                .preferredContactDetails(requestDTO.getPreferredContactDetails().trim())
                .legacyPreferredContact(requestDTO.getPreferredContactDetails().trim())
                .status(TicketStatus.OPEN)
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<TicketAttachment> attachments = ticketAttachmentStorageService.storeAttachments(requestDTO.getAttachments());
        for (TicketAttachment attachment : attachments) {
            attachment.setTicket(ticket);
            ticket.getAttachments().add(attachment);
        }

        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listMyTickets(OidcUser oidcUser, Pageable pageable) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        return ticketRepository.findByCreatedById(actor.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listAssignedTickets(OidcUser oidcUser, Pageable pageable) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole role = currentUserService.roleOf(actor);
        if (role != UserRole.TECHNICIAN && role != UserRole.ADMIN) {
            throw new AccessDeniedException("Technician or admin role required");
        }

        if (role == UserRole.ADMIN) {
            return ticketRepository.findAll(pageable).map(this::toResponse);
        }

        return ticketRepository.findByAssignedTechnicianId(actor.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listAllTickets(OidcUser oidcUser, TicketStatus status, Pageable pageable) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.ADMIN);

        if (status == null) {
            return ticketRepository.findAll(pageable).map(this::toResponse);
        }
        return ticketRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    @Transactional
    public TicketResponseDTO assignTechnician(OidcUser oidcUser, Long ticketId, TicketAssignRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.ADMIN);

        Ticket ticket = getTicketOrThrow(ticketId);
        User technician = userRepository.findById(requestDTO.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("User", requestDTO.getTechnicianId()));

        if (currentUserService.roleOf(technician) != UserRole.TECHNICIAN) {
            throw new IllegalArgumentException("Assigned user must have TECHNICIAN role");
        }

        ticket.setAssignedTechnician(technician);
        ticket.setUpdatedAt(LocalDateTime.now());
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketAssigned(saved);
        return toResponse(saved);
    }

    @Transactional
    public TicketResponseDTO updateStatus(OidcUser oidcUser, Long ticketId, TicketStatusUpdateRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);

        UserRole role = currentUserService.roleOf(actor);
        TicketStatus targetStatus = requestDTO.getStatus();
        if (targetStatus == null) {
            throw new IllegalArgumentException("Ticket status is required");
        }

        TicketStatus previousStatus = ticket.getStatus();

        if (role == UserRole.ADMIN) {
            applyAdminStatusUpdate(ticket, targetStatus, requestDTO.getRejectionReason());
        } else if (role == UserRole.TECHNICIAN) {
            validateAssignedTechnician(ticket, actor);
            applyTechnicianStatusUpdate(ticket, targetStatus);
        } else {
            throw new AccessDeniedException("Only technician or admin can update ticket status");
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketStatusUpdated(saved, previousStatus);
        return toResponse(saved);
    }

    @Transactional
    public TicketResponseDTO updateTicket(OidcUser oidcUser, Long ticketId, TicketUpdateRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);
        validateCanModifyTicket(ticket, actor);
        validateResourceOrLocation(requestDTO.getResourceId(), requestDTO.getLocationReference());

        Resource resource = null;
        if (requestDTO.getResourceId() != null) {
            resource = resourceRepository.findById(requestDTO.getResourceId()).orElse(null);
        }

        String normalizedLocation = normalizeOptional(requestDTO.getLocationReference());
        if (normalizedLocation == null && resource != null) {
            normalizedLocation = normalizeOptional(resource.getLocation());
        }
        if (resource == null && requestDTO.getResourceId() != null && normalizedLocation == null) {
            throw new ResourceNotFoundException("Resource", requestDTO.getResourceId());
        }
        if (normalizedLocation == null) {
            throw new IllegalArgumentException("Location is required when selected resource has no location.");
        }

        ticket.setResource(resource);
        ticket.setLocationReference(normalizedLocation);
        ticket.setLegacyLocation(normalizedLocation);
        ticket.setCategory(requestDTO.getCategory());
        ticket.setDescription(requestDTO.getDescription().trim());
        ticket.setPriority(requestDTO.getPriority());
        ticket.setPreferredContactDetails(requestDTO.getPreferredContactDetails().trim());
        ticket.setLegacyPreferredContact(requestDTO.getPreferredContactDetails().trim());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);
        return toResponse(saved);
    }

    @Transactional
    public void deleteTicket(OidcUser oidcUser, Long ticketId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);
        validateCanModifyTicket(ticket, actor);
        ticketRepository.delete(ticket);
    }

    @Transactional
    public TicketResponseDTO addResolutionNotes(OidcUser oidcUser, Long ticketId, TicketResolutionRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);
        UserRole role = currentUserService.roleOf(actor);

        if (role == UserRole.TECHNICIAN) {
            validateAssignedTechnician(ticket, actor);
        } else if (role != UserRole.ADMIN) {
            throw new AccessDeniedException("Only assigned technician or admin can add resolution notes");
        }

        ticket.setResolutionNotes(requestDTO.getResolutionNotes().trim());
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketCommentResponseDTO addComment(OidcUser oidcUser, Long ticketId, TicketCommentRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);
        validateCanParticipateInComments(ticket, actor);

        TicketComment savedComment = ticketCommentRepository.save(
                TicketComment.builder()
                        .ticket(ticket)
                        .author(actor)
                        .comment(requestDTO.getComment().trim())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );

        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        return toCommentResponse(savedComment);
    }

    @Transactional
    public TicketCommentResponseDTO updateComment(
            OidcUser oidcUser,
            Long ticketId,
            Long commentId,
            TicketCommentUpdateRequestDTO requestDTO
    ) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        TicketComment comment = ticketCommentRepository.findByIdAndTicketId(commentId, ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketComment", commentId));

        validateCommentOwnershipOrAdmin(comment, actor);
        comment.setComment(requestDTO.getComment().trim());
        comment.setUpdatedAt(LocalDateTime.now());

        TicketComment saved = ticketCommentRepository.save(comment);
        Ticket ticket = comment.getTicket();
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        return toCommentResponse(saved);
    }

    @Transactional
    public void deleteComment(OidcUser oidcUser, Long ticketId, Long commentId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        TicketComment comment = ticketCommentRepository.findByIdAndTicketId(commentId, ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketComment", commentId));

        validateCommentOwnershipOrAdmin(comment, actor);
        Ticket ticket = comment.getTicket();
        ticketCommentRepository.delete(comment);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public AttachmentDownload downloadAttachment(OidcUser oidcUser, Long ticketId, Long attachmentId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Ticket ticket = getTicketOrThrow(ticketId);
        validateCanViewTicket(ticket, actor);

        TicketAttachment attachment = ticketAttachmentRepository.findByIdAndTicketId(attachmentId, ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketAttachment", attachmentId));

        return AttachmentDownload.builder()
                .contentType(attachment.getContentType())
                .fileName(attachment.getOriginalFileName())
                .resource(ticketAttachmentStorageService.loadAttachment(attachment.getStoredFileName()))
                .build();
    }

    private Ticket getTicketOrThrow(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId));
    }

    private void validateResourceOrLocation(TicketCreateRequestDTO requestDTO) {
        validateResourceOrLocation(requestDTO.getResourceId(), requestDTO.getLocationReference());
    }

    private void validateResourceOrLocation(Long resourceId, String locationReference) {
        boolean hasResource = resourceId != null;
        boolean hasLocation = locationReference != null && !locationReference.isBlank();
        if (!hasResource && !hasLocation) {
            throw new IllegalArgumentException("Either resourceId or locationReference must be provided");
        }
    }

    private void validateCanModifyTicket(Ticket ticket, User actor) {
        if (currentUserService.isAdmin(actor)) {
            return;
        }

        if (!ticket.getCreatedBy().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only ticket owner or admin can modify this ticket");
        }

        if (ticket.getStatus() != TicketStatus.OPEN
                && ticket.getStatus() != TicketStatus.IN_PROGRESS
                && ticket.getStatus() != TicketStatus.REJECTED) {
            throw new AccessDeniedException("Only OPEN, IN_PROGRESS, or REJECTED tickets can be modified");
        }
    }

    private void validateAssignedTechnician(Ticket ticket, User actor) {
        if (ticket.getAssignedTechnician() == null || !ticket.getAssignedTechnician().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Ticket is not assigned to the authenticated technician");
        }
    }

    private void applyAdminStatusUpdate(Ticket ticket, TicketStatus targetStatus, String rejectionReason) {
        ticket.setStatus(targetStatus);
        if (targetStatus == TicketStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when status is REJECTED");
            }
            ticket.setRejectionReason(rejectionReason.trim());
        } else {
            ticket.setRejectionReason(null);
        }
    }

    private void applyTechnicianStatusUpdate(Ticket ticket, TicketStatus targetStatus) {
        if (targetStatus == TicketStatus.REJECTED || targetStatus == TicketStatus.OPEN) {
            throw new AccessDeniedException("Technician cannot set this ticket status");
        }
        ticket.setStatus(targetStatus);
        if (targetStatus != TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }
    }

    private void validateCanViewTicket(Ticket ticket, User actor) {
        if (currentUserService.isAdmin(actor)) {
            return;
        }
        boolean isCreator = ticket.getCreatedBy().getId().equals(actor.getId());
        boolean isAssignedTech = ticket.getAssignedTechnician() != null
                && ticket.getAssignedTechnician().getId().equals(actor.getId());
        if (!isCreator && !isAssignedTech) {
            throw new AccessDeniedException("You are not allowed to access this ticket");
        }
    }

    private void validateCanParticipateInComments(Ticket ticket, User actor) {
        if (currentUserService.isAdmin(actor)) {
            return;
        }
        boolean isCreator = ticket.getCreatedBy().getId().equals(actor.getId());
        boolean isAssignedTech = ticket.getAssignedTechnician() != null
                && ticket.getAssignedTechnician().getId().equals(actor.getId());
        if (!isCreator && !isAssignedTech) {
            throw new AccessDeniedException("You are not allowed to comment on this ticket");
        }
    }

    private void validateCommentOwnershipOrAdmin(TicketComment comment, User actor) {
        if (currentUserService.isAdmin(actor)) {
            return;
        }
        if (!comment.getAuthor().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only comment owner or admin can modify this comment");
        }
    }

    private TicketResponseDTO toResponse(Ticket ticket) {
        List<TicketAttachmentResponseDTO> attachments = ticket.getAttachments().stream()
                .sorted(Comparator.comparing(TicketAttachment::getCreatedAt))
                .map(attachment -> TicketAttachmentResponseDTO.builder()
                        .id(attachment.getId())
                        .originalFileName(attachment.getOriginalFileName())
                        .contentType(attachment.getContentType())
                        .sizeBytes(attachment.getSizeBytes())
                        .downloadUrl("/api/tickets/" + ticket.getId() + "/attachments/" + attachment.getId())
                        .build())
                .toList();

        List<TicketCommentResponseDTO> comments = ticket.getComments().stream()
                .sorted(Comparator.comparing(TicketComment::getCreatedAt))
                .map(this::toCommentResponse)
                .toList();

        String resolvedLocation = normalizeOptional(ticket.getLocationReference());
        if (resolvedLocation == null) {
            resolvedLocation = normalizeOptional(ticket.getLegacyLocation());
        }
        String resolvedPreferredContact = normalizeOptional(ticket.getPreferredContactDetails());
        if (resolvedPreferredContact == null) {
            resolvedPreferredContact = normalizeOptional(ticket.getLegacyPreferredContact());
        }

        return TicketResponseDTO.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResource() == null ? null : ticket.getResource().getId())
                .resourceName(ticket.getResource() == null ? null : ticket.getResource().getName())
                .locationReference(resolvedLocation)
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .preferredContactDetails(resolvedPreferredContact)
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .assignedTechnicianId(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getId())
                .assignedTechnicianName(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getName())
                .resolutionNotes(ticket.getResolutionNotes())
                .createdById(ticket.getCreatedBy().getId())
                .createdByName(ticket.getCreatedBy().getName())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachments(attachments)
                .comments(comments)
                .build();
    }

    private TicketCommentResponseDTO toCommentResponse(TicketComment comment) {
        return TicketCommentResponseDTO.builder()
                .id(comment.getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getName())
                .comment(comment.getComment())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    @Builder
    public record AttachmentDownload(org.springframework.core.io.Resource resource, String contentType, String fileName) {
    }
}
