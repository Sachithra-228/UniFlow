package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.TicketCategory;
import com.smartcampus.backend.entity.TicketPriority;
import com.smartcampus.backend.entity.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TicketResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private String locationReference;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private String preferredContactDetails;
    private TicketStatus status;
    private String rejectionReason;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String resolutionNotes;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TicketAttachmentResponseDTO> attachments;
    private List<TicketCommentResponseDTO> comments;
}

