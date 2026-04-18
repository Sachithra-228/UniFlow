package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.CampusEventCreateRequestDTO;
import com.smartcampus.backend.dto.CampusEventResponseDTO;
import com.smartcampus.backend.dto.CampusEventStatusUpdateRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentDecisionRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentResponseDTO;
import com.smartcampus.backend.entity.CampusEvent;
import com.smartcampus.backend.entity.CampusEventStatus;
import com.smartcampus.backend.entity.EventEnrollment;
import com.smartcampus.backend.entity.EventEnrollmentStatus;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.CampusEventRepository;
import com.smartcampus.backend.repository.EventEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampusEventService {

    private final CampusEventRepository campusEventRepository;
    private final EventEnrollmentRepository eventEnrollmentRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<CampusEventResponseDTO> listEvents(OidcUser oidcUser, Pageable pageable, boolean mineOnly) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole role = currentUserService.roleOf(actor);

        Page<CampusEvent> events;
        if (mineOnly && (role == UserRole.STAFF || role == UserRole.ADMIN)) {
            events = campusEventRepository.findByCreatedById(actor.getId(), pageable);
        } else {
            events = campusEventRepository.findAll(pageable);
        }

        return events.map(event -> toEventResponse(event, actor.getId()));
    }

    @Transactional
    public CampusEventResponseDTO createEvent(OidcUser oidcUser, CampusEventCreateRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.STAFF, UserRole.ADMIN);

        validateEventWindow(requestDTO.getStartsAt(), requestDTO.getEndsAt(), requestDTO.getEnrollmentDeadline());

        CampusEvent event = CampusEvent.builder()
                .title(requestDTO.getTitle().trim())
                .description(normalizeOptional(requestDTO.getDescription()))
                .location(requestDTO.getLocation().trim())
                .startsAt(requestDTO.getStartsAt())
                .endsAt(requestDTO.getEndsAt())
                .enrollmentDeadline(requestDTO.getEnrollmentDeadline())
                .capacity(requestDTO.getCapacity())
                .status(CampusEventStatus.OPEN)
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CampusEvent saved = campusEventRepository.save(event);
        notificationService.notifyCampusEventCreated(saved);
        return toEventResponse(saved, actor.getId());
    }

    @Transactional
    public CampusEventResponseDTO updateEventStatus(
            OidcUser oidcUser,
            Long eventId,
            CampusEventStatusUpdateRequestDTO requestDTO
    ) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        CampusEvent event = getEventOrThrow(eventId);
        validateCanManageEvent(event, actor);

        CampusEventStatus targetStatus = requestDTO.getStatus();
        if (targetStatus == null) {
            throw new IllegalArgumentException("Event status is required");
        }

        event.setStatus(targetStatus);
        event.setUpdatedAt(LocalDateTime.now());
        CampusEvent saved = campusEventRepository.save(event);
        return toEventResponse(saved, actor.getId());
    }

    @Transactional
    public EventEnrollmentResponseDTO requestEnrollment(
            OidcUser oidcUser,
            Long eventId,
            EventEnrollmentRequestDTO requestDTO
    ) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.STUDENT);

        CampusEvent event = getEventOrThrow(eventId);
        validateCanEnroll(event);

        long approvedCount = eventEnrollmentRepository.countByEventIdAndStatus(event.getId(), EventEnrollmentStatus.APPROVED);
        if (approvedCount >= event.getCapacity()) {
            throw new IllegalStateException("Event is already full");
        }

        EventEnrollment enrollment = eventEnrollmentRepository.findByEventIdAndStudentId(event.getId(), actor.getId())
                .orElse(null);

        String requestMessage = normalizeOptional(requestDTO == null ? null : requestDTO.getMessage());
        if (enrollment == null) {
            enrollment = EventEnrollment.builder()
                    .event(event)
                    .student(actor)
                    .status(EventEnrollmentStatus.PENDING)
                    .requestMessage(requestMessage)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else if (enrollment.getStatus() == EventEnrollmentStatus.PENDING) {
            throw new IllegalStateException("Enrollment request already pending for this event");
        } else if (enrollment.getStatus() == EventEnrollmentStatus.APPROVED) {
            throw new IllegalStateException("You are already approved for this event");
        } else {
            enrollment.setStatus(EventEnrollmentStatus.PENDING);
            enrollment.setRequestMessage(requestMessage);
            enrollment.setReviewNote(null);
            enrollment.setReviewedBy(null);
            enrollment.setUpdatedAt(LocalDateTime.now());
        }

        EventEnrollment saved = eventEnrollmentRepository.save(enrollment);
        notificationService.notifyEventEnrollmentRequested(saved);
        return toEnrollmentResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<EventEnrollmentResponseDTO> listMyEnrollments(OidcUser oidcUser, Pageable pageable) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        return eventEnrollmentRepository.findByStudentIdOrderByCreatedAtDesc(actor.getId(), pageable)
                .map(this::toEnrollmentResponse);
    }

    @Transactional(readOnly = true)
    public List<EventEnrollmentResponseDTO> listEventEnrollments(OidcUser oidcUser, Long eventId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        CampusEvent event = getEventOrThrow(eventId);
        validateCanManageEvent(event, actor);

        return eventEnrollmentRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(this::toEnrollmentResponse)
                .toList();
    }

    @Transactional
    public EventEnrollmentResponseDTO reviewEnrollment(
            OidcUser oidcUser,
            Long eventId,
            Long enrollmentId,
            EventEnrollmentDecisionRequestDTO requestDTO
    ) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        CampusEvent event = getEventOrThrow(eventId);
        validateCanManageEvent(event, actor);

        EventEnrollment enrollment = eventEnrollmentRepository.findByIdAndEventId(enrollmentId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("EventEnrollment", enrollmentId));

        EventEnrollmentStatus decision = requestDTO.getStatus();
        if (decision != EventEnrollmentStatus.APPROVED && decision != EventEnrollmentStatus.REJECTED) {
            throw new IllegalArgumentException("Only APPROVED or REJECTED decisions are allowed");
        }

        if (decision == EventEnrollmentStatus.APPROVED && enrollment.getStatus() != EventEnrollmentStatus.APPROVED) {
            long approvedCount = eventEnrollmentRepository.countByEventIdAndStatus(eventId, EventEnrollmentStatus.APPROVED);
            if (approvedCount >= event.getCapacity()) {
                throw new IllegalStateException("Cannot approve enrollment. Event capacity reached.");
            }
        }

        enrollment.setStatus(decision);
        enrollment.setReviewNote(normalizeOptional(requestDTO.getNote()));
        enrollment.setReviewedBy(actor);
        enrollment.setUpdatedAt(LocalDateTime.now());

        EventEnrollment saved = eventEnrollmentRepository.save(enrollment);
        notificationService.notifyEventEnrollmentReviewed(saved);
        return toEnrollmentResponse(saved);
    }

    private CampusEvent getEventOrThrow(Long eventId) {
        return campusEventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusEvent", eventId));
    }

    private void validateCanManageEvent(CampusEvent event, User actor) {
        UserRole role = currentUserService.roleOf(actor);
        if (role == UserRole.ADMIN || role == UserRole.STAFF) {
            return;
        }
        throw new AccessDeniedException("Only staff or admin can manage this event");
    }

    private void validateCanEnroll(CampusEvent event) {
        if (event.getStatus() != CampusEventStatus.OPEN) {
            throw new IllegalStateException("Event enrollment is closed");
        }

        LocalDateTime now = LocalDateTime.now();
        if (event.getEnrollmentDeadline() != null && now.isAfter(event.getEnrollmentDeadline())) {
            throw new IllegalStateException("Enrollment deadline has passed");
        }
        if (now.isAfter(event.getStartsAt())) {
            throw new IllegalStateException("Event has already started");
        }
    }

    private void validateEventWindow(LocalDateTime startsAt, LocalDateTime endsAt, LocalDateTime enrollmentDeadline) {
        if (startsAt == null || endsAt == null) {
            throw new IllegalArgumentException("Start and end times are required");
        }
        if (!endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (enrollmentDeadline != null && enrollmentDeadline.isAfter(startsAt)) {
            throw new IllegalArgumentException("Enrollment deadline must be before event start time");
        }
    }

    private CampusEventResponseDTO toEventResponse(CampusEvent event, Long currentUserId) {
        long approvedCount = eventEnrollmentRepository.countByEventIdAndStatus(event.getId(), EventEnrollmentStatus.APPROVED);
        long pendingCount = eventEnrollmentRepository.countByEventIdAndStatus(event.getId(), EventEnrollmentStatus.PENDING);
        long seatsRemaining = Math.max(0, event.getCapacity() - approvedCount);
        EventEnrollmentStatus myEnrollmentStatus = null;

        if (currentUserId != null) {
            myEnrollmentStatus = eventEnrollmentRepository.findByEventIdAndStudentId(event.getId(), currentUserId)
                    .map(EventEnrollment::getStatus)
                    .orElse(null);
        }

        return CampusEventResponseDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .startsAt(event.getStartsAt())
                .endsAt(event.getEndsAt())
                .enrollmentDeadline(event.getEnrollmentDeadline())
                .capacity(event.getCapacity())
                .status(event.getStatus())
                .createdById(event.getCreatedBy().getId())
                .createdByName(event.getCreatedBy().getName())
                .approvedCount(approvedCount)
                .pendingCount(pendingCount)
                .seatsRemaining(seatsRemaining)
                .myEnrollmentStatus(myEnrollmentStatus)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private EventEnrollmentResponseDTO toEnrollmentResponse(EventEnrollment enrollment) {
        return EventEnrollmentResponseDTO.builder()
                .id(enrollment.getId())
                .eventId(enrollment.getEvent().getId())
                .eventTitle(enrollment.getEvent().getTitle())
                .eventStartsAt(enrollment.getEvent().getStartsAt())
                .eventEndsAt(enrollment.getEvent().getEndsAt())
                .eventLocation(enrollment.getEvent().getLocation())
                .studentId(enrollment.getStudent().getId())
                .studentName(enrollment.getStudent().getName())
                .studentEmail(enrollment.getStudent().getEmail())
                .status(enrollment.getStatus())
                .requestMessage(enrollment.getRequestMessage())
                .reviewNote(enrollment.getReviewNote())
                .reviewedById(enrollment.getReviewedBy() == null ? null : enrollment.getReviewedBy().getId())
                .reviewedByName(enrollment.getReviewedBy() == null ? null : enrollment.getReviewedBy().getName())
                .createdAt(enrollment.getCreatedAt())
                .updatedAt(enrollment.getUpdatedAt())
                .build();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
