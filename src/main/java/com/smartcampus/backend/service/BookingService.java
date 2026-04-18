package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.dto.BookingStatusUpdateRequestDTO;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.BookingStatus;
import com.smartcampus.backend.entity.Resource;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.UserRole;
import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable).map(this::toBookingResponse);
    }

    @Transactional
    public BookingResponseDTO createBooking(OidcUser oidcUser, BookingRequestDTO requestDTO) {
        validateBookingWindow(requestDTO.getStartTime(), requestDTO.getEndTime());

        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole actorRole = currentUserService.roleOf(actor);

        Long targetUserId = (actorRole == UserRole.ADMIN || actorRole == UserRole.STAFF)
                ? requestDTO.getUserId()
                : actor.getId();

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        Resource resource = resourceRepository.findById(requestDTO.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", requestDTO.getResourceId()));

        boolean hasOverlap = bookingRepository.existsOverlappingBooking(
                resource.getId(),
                requestDTO.getStartTime(),
                requestDTO.getEndTime(),
                List.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );
        if (hasOverlap) {
            throw new BookingConflictException("Booking time overlaps with an existing reservation.");
        }

        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(requestDTO.getStartTime())
                .endTime(requestDTO.getEndTime())
                .status(BookingStatus.PENDING)
                .purpose(requestDTO.getPurpose())
                .createdAt(LocalDateTime.now())
                .build();

        try {
            Booking savedBooking = bookingRepository.save(booking);
            return toBookingResponse(savedBooking);
        } catch (DataIntegrityViolationException ex) {
            if (isOverlapConflict(ex)) {
                throw new BookingConflictException("Booking time overlaps with an existing reservation.");
            }
            throw ex;
        }
    }

    @Transactional
    public BookingResponseDTO updateBookingStatus(
            OidcUser oidcUser,
            Long bookingId,
            BookingStatusUpdateRequestDTO requestDTO
    ) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.ADMIN, UserRole.STAFF);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        BookingStatus targetStatus = requestDTO.getStatus();
        if (targetStatus == null) {
            throw new IllegalArgumentException("Booking status is required");
        }
        if (targetStatus != BookingStatus.APPROVED && targetStatus != BookingStatus.REJECTED) {
            throw new AccessDeniedException("Only APPROVED or REJECTED status updates are allowed");
        }

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(targetStatus);
        Booking saved = bookingRepository.save(booking);
        notificationService.notifyBookingStatusUpdated(saved, previousStatus);
        return toBookingResponse(saved);
    }

    @Transactional
    public BookingResponseDTO updateBooking(
            OidcUser oidcUser,
            Long bookingId,
            BookingRequestDTO requestDTO
    ) {
        validateBookingWindow(requestDTO.getStartTime(), requestDTO.getEndTime());

        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole actorRole = currentUserService.roleOf(actor);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean canModerate = actorRole == UserRole.ADMIN || actorRole == UserRole.STAFF;
        if (!canModerate && booking.getStatus() != BookingStatus.PENDING) {
            throw new AccessDeniedException("Only pending bookings can be edited");
        }

        Long targetUserId = canModerate ? requestDTO.getUserId() : booking.getUser().getId();
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        Resource resource = resourceRepository.findById(requestDTO.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", requestDTO.getResourceId()));

        boolean hasOverlap = bookingRepository.existsOverlappingBookingExcludingId(
                bookingId,
                resource.getId(),
                requestDTO.getStartTime(),
                requestDTO.getEndTime(),
                List.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );
        if (hasOverlap) {
            throw new BookingConflictException("Booking time overlaps with an existing reservation.");
        }

        booking.setUser(user);
        booking.setResource(resource);
        booking.setStartTime(requestDTO.getStartTime());
        booking.setEndTime(requestDTO.getEndTime());
        booking.setPurpose(requestDTO.getPurpose());
        Booking saved = bookingRepository.save(booking);
        return toBookingResponse(saved);
    }

    @Transactional
    public void deleteBooking(OidcUser oidcUser, Long bookingId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole actorRole = currentUserService.roleOf(actor);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean canModerate = actorRole == UserRole.ADMIN || actorRole == UserRole.STAFF;
        if (!canModerate && booking.getStatus() != BookingStatus.PENDING) {
            throw new AccessDeniedException("Only pending bookings can be deleted");
        }

        bookingRepository.delete(booking);
    }

    private void validateBookingWindow(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time are required.");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }
    }

    private boolean isOverlapConflict(DataIntegrityViolationException ex) {
        Throwable root = ex.getMostSpecificCause();
        if (root == null || root.getMessage() == null) {
            return false;
        }

        String message = root.getMessage().toLowerCase(Locale.ROOT);
        return message.contains("exclude")
                || message.contains("overlap")
                || message.contains("conflict")
                || message.contains("bookings");
    }

    private BookingResponseDTO toBookingResponse(Booking booking) {
        return BookingResponseDTO.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .purpose(booking.getPurpose())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
