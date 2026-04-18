package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActivationRequestDTO {

    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @Size(max = 120)
    private String name;
}

