package com.smartcampus.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountLinkRejectRequestDTO {

    @Size(max = 500)
    private String note;
}

