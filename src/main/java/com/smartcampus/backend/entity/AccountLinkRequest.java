package com.smartcampus.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "account_link_requests")
public class AccountLinkRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requested_google_email", nullable = false)
    private String requestedGoogleEmail;

    @Column(name = "requested_google_subject")
    private String requestedGoogleSubject;

    @Column(name = "requested_display_name")
    private String requestedDisplayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LinkRequestStatus status;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "decision_note")
    private String decisionNote;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}

