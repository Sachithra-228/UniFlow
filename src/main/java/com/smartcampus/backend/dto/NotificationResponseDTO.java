package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDTO {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private NotificationType type;
    private boolean readStatus;
    private LocalDateTime createdAt;
}
