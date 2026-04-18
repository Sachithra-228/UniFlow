package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.CampusEventStatus;
import com.smartcampus.backend.entity.EventEnrollmentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CampusEventResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime enrollmentDeadline;
    private Integer capacity;
    private CampusEventStatus status;
    private Long createdById;
    private String createdByName;
    private long approvedCount;
    private long pendingCount;
    private long seatsRemaining;
    private EventEnrollmentStatus myEnrollmentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
