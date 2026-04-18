package com.smartcampus.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CampusEventCreateRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotBlank(message = "Location is required")
    @Size(max = 300, message = "Location cannot exceed 300 characters")
    private String location;

    @NotNull(message = "Start time is required")
    private LocalDateTime startsAt;

    @NotNull(message = "End time is required")
    private LocalDateTime endsAt;

    private LocalDateTime enrollmentDeadline;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}
