package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.NotificationResponseDTO;
import com.smartcampus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    public Page<NotificationResponseDTO> getMyNotifications(
            @AuthenticationPrincipal OidcUser oidcUser,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return notificationService.getMyNotifications(oidcUser, pageable, unreadOnly);
    }

    @GetMapping("/my/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal OidcUser oidcUser) {
        return Map.of("count", notificationService.getUnreadCount(oidcUser));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponseDTO markRead(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id
    ) {
        return notificationService.markAsRead(oidcUser, id);
    }

    @PatchMapping("/read-all")
    public Map<String, Object> markAllRead(@AuthenticationPrincipal OidcUser oidcUser) {
        int updatedCount = notificationService.markAllAsRead(oidcUser);
        return Map.of("updatedCount", updatedCount);
    }
}
