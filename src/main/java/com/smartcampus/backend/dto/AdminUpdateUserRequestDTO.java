package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.AccountStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateUserRequestDTO {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    private String role;

    private AccountStatus accountStatus;
}

