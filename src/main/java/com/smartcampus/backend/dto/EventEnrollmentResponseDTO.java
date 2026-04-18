package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.EventEnrollmentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EventEnrollmentResponseDTO {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime eventStartsAt;
    private LocalDateTime eventEndsAt;
    private String eventLocation;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private EventEnrollmentStatus status;
    private String requestMessage;
    private String reviewNote;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
