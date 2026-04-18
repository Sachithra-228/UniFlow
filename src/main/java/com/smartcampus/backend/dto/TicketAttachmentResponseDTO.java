package com.smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketAttachmentResponseDTO {
    private Long id;
    private String originalFileName;
    private String contentType;
    private long sizeBytes;
    private String downloadUrl;
}

