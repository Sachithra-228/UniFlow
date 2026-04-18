package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketAssignRequestDTO {
    @NotNull
    private Long technicianId;
}

