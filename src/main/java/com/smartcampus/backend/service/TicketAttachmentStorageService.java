package com.smartcampus.backend.service;

import com.smartcampus.backend.entity.TicketAttachment;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class TicketAttachmentStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    @Value("${app.ticket.attachments-dir:storage/ticket-attachments}")
    private String attachmentsDir;

    @Value("${app.ticket.max-attachments:3}")
    private int maxAttachments;

    @Value("${app.ticket.max-attachment-size-bytes:5242880}")
    private long maxAttachmentSizeBytes;

    private Path storageRoot;

    @PostConstruct
    void initStorage() {
        try {
            storageRoot = Path.of(attachmentsDir).toAbsolutePath().normalize();
            Files.createDirectories(storageRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to initialize ticket attachment storage", ex);
        }
    }

    public int getMaxAttachments() {
        return maxAttachments;
    }

    public List<TicketAttachment> storeAttachments(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<MultipartFile> nonEmptyFiles = files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();

        if (nonEmptyFiles.size() > maxAttachments) {
            throw new IllegalArgumentException("Maximum " + maxAttachments + " attachments are allowed per ticket");
        }

        List<TicketAttachment> attachments = new ArrayList<>();
        for (MultipartFile file : nonEmptyFiles) {
            validateFile(file);
            String originalName = sanitizeOriginalFilename(file.getOriginalFilename());
            String extension = detectExtension(originalName, file.getContentType());
            String storedName = UUID.randomUUID() + extension;
            Path destination = storageRoot.resolve(storedName).normalize();
            if (!destination.startsWith(storageRoot)) {
                throw new IllegalArgumentException("Invalid attachment path");
            }

            try {
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                throw new IllegalStateException("Failed to store attachment: " + originalName, ex);
            }

            attachments.add(
                    TicketAttachment.builder()
                            .originalFileName(originalName)
                            .storedFileName(storedName)
                            .contentType(file.getContentType())
                            .sizeBytes(file.getSize())
                            .build()
            );
        }

        return attachments;
    }

    public Resource loadAttachment(String storedFileName) {
        try {
            Path filePath = storageRoot.resolve(storedFileName).normalize();
            if (!filePath.startsWith(storageRoot)) {
                throw new IllegalArgumentException("Invalid attachment path");
            }
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                throw new IllegalArgumentException("Attachment file not found");
            }
            return new ByteArrayResource(Files.readAllBytes(filePath));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read attachment", ex);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() <= 0) {
            throw new IllegalArgumentException("Attachment file is empty");
        }
        if (file.getSize() > maxAttachmentSizeBytes) {
            throw new IllegalArgumentException("Attachment exceeds maximum allowed size");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WEBP image attachments are allowed");
        }
    }

    private String sanitizeOriginalFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "attachment";
        }
        String safe = Path.of(filename).getFileName().toString().replaceAll("[\\r\\n]", "");
        return safe.isBlank() ? "attachment" : safe;
    }

    private String detectExtension(String originalName, String contentType) {
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > -1 && dotIndex < originalName.length() - 1) {
            String ext = originalName.substring(dotIndex);
            if (ext.length() <= 8) {
                return ext.toLowerCase();
            }
        }
        if ("image/png".equalsIgnoreCase(contentType)) {
            return ".png";
        }
        if ("image/webp".equalsIgnoreCase(contentType)) {
            return ".webp";
        }
        return ".jpg";
    }
}

