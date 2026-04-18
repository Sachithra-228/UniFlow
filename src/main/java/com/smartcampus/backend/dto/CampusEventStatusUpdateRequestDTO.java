package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.CampusEventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CampusEventStatusUpdateRequestDTO {

    @NotNull(message = "Status is required")
    private CampusEventStatus status;
}
