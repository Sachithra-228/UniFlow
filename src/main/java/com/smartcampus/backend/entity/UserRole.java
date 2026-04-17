package com.smartcampus.backend.entity;

import java.util.Arrays;

public enum UserRole {
    STUDENT,
    STAFF,
    TECHNICIAN,
    ADMIN;

    public static UserRole from(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        String normalized = raw.trim().toUpperCase();
        if ("USER".equals(normalized)) {
            return STUDENT;
        }

        return Arrays.stream(values())
                .filter(role -> role.name().equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported role: " + raw));
    }
}

