package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.TicketVisitEventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketVisitEventResponseDTO {
    private Long id;
    private Long ticketId;
    private Long technicianId;
    private String technicianName;
    private TicketVisitEventType eventType;
    private String note;
    private LocalDateTime createdAt;
}

