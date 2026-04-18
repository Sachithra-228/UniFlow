package com.smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketCommentResponseDTO {
    private Long id;
    private Long authorId;
    private String authorName;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

