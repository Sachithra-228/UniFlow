package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.EventEnrollmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventEnrollmentDecisionRequestDTO {

    @NotNull(message = "Decision status is required")
    private EventEnrollmentStatus status;

    @Size(max = 500, message = "Review note cannot exceed 500 characters")
    private String note;
}
