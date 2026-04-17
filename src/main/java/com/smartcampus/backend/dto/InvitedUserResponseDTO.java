package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.AccountStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvitedUserResponseDTO {
    private Long id;
    private String email;
    private String name;
    private String role;
    private AccountStatus accountStatus;
    private LocalDateTime inviteTokenExpiresAt;
}

