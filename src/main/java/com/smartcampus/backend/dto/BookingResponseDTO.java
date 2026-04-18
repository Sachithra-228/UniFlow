package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {

    private Long id;
    private Long userId;
    private String userName;
    private Long resourceId;
    private String resourceName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private String purpose;
    private boolean checkInQrGenerated;
    private LocalDateTime checkedInAt;
    private String checkedInByName;
    private LocalDateTime createdAt;
}
