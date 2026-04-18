package com.smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TicketVisitTimelineResponseDTO {
    private Long ticketId;
    private List<TicketVisitEventResponseDTO> events;
}

