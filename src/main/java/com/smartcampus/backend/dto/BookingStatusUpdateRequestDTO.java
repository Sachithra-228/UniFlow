package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingStatusUpdateRequestDTO {
    @NotNull
    private BookingStatus status;
}

