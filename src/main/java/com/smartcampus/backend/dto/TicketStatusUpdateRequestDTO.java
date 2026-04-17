package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TicketStatusUpdateRequestDTO {
    @NotNull
    private TicketStatus status;

    @Size(max = 1000)
    private String rejectionReason;
}

