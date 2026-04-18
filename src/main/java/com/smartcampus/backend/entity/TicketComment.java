package com.smartcampus.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "ticket_comments")
public class TicketComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "comment", nullable = false, length = 2000)
    private String comment;

    @Column(name = "content", nullable = false, length = 2000)
    private String legacyContent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        syncLegacyColumns();
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        syncLegacyColumns();
        updatedAt = LocalDateTime.now();
    }

    public String getComment() {
        if (comment == null || comment.isBlank()) {
            return legacyContent;
        }
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
        this.legacyContent = comment;
    }

    private void syncLegacyColumns() {
        if ((comment == null || comment.isBlank()) && legacyContent != null && !legacyContent.isBlank()) {
            comment = legacyContent;
        }
        if ((legacyContent == null || legacyContent.isBlank()) && comment != null && !comment.isBlank()) {
            legacyContent = comment;
        }
    }
}

