package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {

    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime createdAt;
    private String providerId;
    private String provider;
    private String googleEmail;
    private AccountStatus accountStatus;
    private LocalDateTime activatedAt;
}
