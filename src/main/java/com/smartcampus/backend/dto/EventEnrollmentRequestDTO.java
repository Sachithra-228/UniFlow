package com.smartcampus.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventEnrollmentRequestDTO {

    @Size(max = 500, message = "Request message cannot exceed 500 characters")
    private String message;
}
