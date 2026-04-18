package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.LinkRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AccountLinkRequestResponseDTO {
    private Long id;
    private String requestedGoogleEmail;
    private String requestedDisplayName;
    private String requestedGoogleSubject;
    private LinkRequestStatus status;
    private Long targetUserId;
    private String decisionNote;
    private String reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}

