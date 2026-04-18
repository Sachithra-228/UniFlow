package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.TicketVisitEventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TicketVisitEventCreateRequestDTO {
    @NotNull
    private TicketVisitEventType eventType;

    @Size(max = 1000)
    private String note;
}

