package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.NotificationResponseDTO;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.BookingStatus;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.entity.NotificationType;
import com.smartcampus.backend.entity.Ticket;
import com.smartcampus.backend.entity.TicketStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<NotificationResponseDTO> getMyNotifications(OidcUser oidcUser, Pageable pageable, boolean unreadOnly) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByUserIdAndReadStatusOrderByCreatedAtDesc(actor.getId(), false, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(actor.getId(), pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public NotificationResponseDTO markAsRead(OidcUser oidcUser, Long notificationId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        notification.setReadStatus(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(OidcUser oidcUser) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        List<Notification> unread = notificationRepository.findByUserIdAndReadStatus(actor.getId(), false);
        unread.forEach(notification -> notification.setReadStatus(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public void notifyTicketCreated(Ticket ticket) {
        createNotification(ticket.getCreatedBy(),
                "Ticket Created",
                "Your support ticket #" + ticket.getId() + " was created successfully.",
                NotificationType.INFO);

        List<User> admins = userRepository.findByRoleIgnoreCase(UserRole.ADMIN.name());
        for (User admin : admins) {
            if (admin.getId().equals(ticket.getCreatedBy().getId())) {
                continue;
            }
            createNotification(admin,
                    "New Ticket",
                    ticket.getCreatedBy().getName() + " created ticket #" + ticket.getId() + ".",
                    NotificationType.ALERT);
        }
    }

    @Transactional
    public void notifyTicketAssigned(Ticket ticket) {
        if (ticket.getAssignedTechnician() != null) {
            createNotification(ticket.getAssignedTechnician(),
                    "Ticket Assigned",
                    "Ticket #" + ticket.getId() + " is now assigned to you.",
                    NotificationType.ALERT);
        }

        createNotification(ticket.getCreatedBy(),
                "Ticket Assignment Updated",
                "Ticket #" + ticket.getId() + " was assigned to " +
                        (ticket.getAssignedTechnician() == null ? "a technician" : ticket.getAssignedTechnician().getName()),
                NotificationType.INFO);
    }

    @Transactional
    public void notifyTicketStatusUpdated(Ticket ticket, TicketStatus previousStatus) {
        if (previousStatus == ticket.getStatus()) {
            return;
        }

        String message = "Ticket #" + ticket.getId() + " moved to " + ticket.getStatus() + ".";
        if (ticket.getStatus() == TicketStatus.REJECTED && ticket.getRejectionReason() != null) {
            message = message + " Reason: " + ticket.getRejectionReason();
        }

        Set<Long> notifiedUserIds = new LinkedHashSet<>();
        createNotification(ticket.getCreatedBy(), "Ticket Status Updated", message, NotificationType.ALERT);
        notifiedUserIds.add(ticket.getCreatedBy().getId());

        if (ticket.getAssignedTechnician() != null && !notifiedUserIds.contains(ticket.getAssignedTechnician().getId())) {
            createNotification(ticket.getAssignedTechnician(), "Ticket Status Updated", message, NotificationType.INFO);
        }
    }

    @Transactional
    public void notifyBookingStatusUpdated(Booking booking, BookingStatus previousStatus) {
        if (previousStatus == booking.getStatus()) {
            return;
        }
        if (booking.getStatus() != BookingStatus.APPROVED && booking.getStatus() != BookingStatus.REJECTED) {
            return;
        }

        String message = "Booking #" + booking.getId() + " is now " + booking.getStatus()
                + " for resource " + booking.getResource().getName();
        createNotification(booking.getUser(), "Booking Status Updated", message, NotificationType.INFO);
    }

    private void createNotification(User user, String title, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .recipient(user)
                .title(title)
                .message(message)
                .type(type)
                .readStatus(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    private NotificationResponseDTO toResponse(Notification notification) {
        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .readStatus(notification.isReadStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
