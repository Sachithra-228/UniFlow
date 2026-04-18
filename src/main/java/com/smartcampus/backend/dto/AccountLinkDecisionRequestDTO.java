package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountLinkDecisionRequestDTO {

    @NotNull
    private Long userId;

    @Size(max = 500)
    private String note;
}

