package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingCheckInScanRequestDTO {

    @NotBlank
    private String qrPayload;
}
