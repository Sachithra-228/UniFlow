package com.smartcampus.backend.dto;

import com.smartcampus.backend.entity.TicketCategory;
import com.smartcampus.backend.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Data
public class TicketCreateRequestDTO {

    private Long resourceId;

    @Size(max = 255)
    private String locationReference;

    @NotNull
    private TicketCategory category;

    @NotBlank
    @Size(max = 2000)
    private String description;

    @NotNull
    private TicketPriority priority;

    @NotBlank
    @Size(max = 300)
    private String preferredContactDetails;

    private List<MultipartFile> attachments = new ArrayList<>();
}

