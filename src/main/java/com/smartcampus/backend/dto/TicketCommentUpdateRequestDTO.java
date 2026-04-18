package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TicketCommentUpdateRequestDTO {
    @NotBlank
    @Size(max = 2000)
    private String comment;
}

