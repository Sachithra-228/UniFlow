package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingCheckInQrResponseDTO;
import com.smartcampus.backend.dto.BookingCheckInResultDTO;
import com.smartcampus.backend.dto.BookingCheckInScanRequestDTO;
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
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final String QR_CHECK_IN_PREFIX = "SCBK-CHECKIN:";
    private static final int QR_IMAGE_SIZE_PX = 320;

    @Value("${app.booking.checkin-early-minutes:20}")
    private long checkInEarlyMinutes;

    @Value("${app.booking.checkin-late-minutes:30}")
    private long checkInLateMinutes;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final QrCodeService qrCodeService;

    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(OidcUser oidcUser, Pageable pageable) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        UserRole role = currentUserService.roleOf(actor);

        if (role == UserRole.ADMIN || role == UserRole.STAFF) {
            return bookingRepository.findAll(pageable).map(this::toBookingResponse);
        }

        return bookingRepository.findByUserId(actor.getId(), pageable).map(this::toBookingResponse);
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
        updateCheckInArtifactsForStatusChange(booking, previousStatus, targetStatus);
        Booking saved = bookingRepository.save(booking);
        notificationService.notifyBookingStatusUpdated(saved, previousStatus);
        return toBookingResponse(saved);
    }

    @Transactional
    public BookingCheckInQrResponseDTO getBookingCheckInQrCode(OidcUser oidcUser, Long bookingId) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        ensureCanViewBookingQr(actor, booking);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("QR code is available only for approved bookings.");
        }

        if (booking.getQrCheckInToken() == null || booking.getQrCheckInToken().isBlank()) {
            assignNewCheckInToken(booking);
            booking = bookingRepository.save(booking);
        }

        String qrPayload = buildQrPayload(booking.getQrCheckInToken());
        LocalDateTime validFrom = booking.getStartTime().minusMinutes(checkInEarlyMinutes);
        LocalDateTime validUntil = booking.getEndTime().plusMinutes(checkInLateMinutes);

        return BookingCheckInQrResponseDTO.builder()
                .bookingId(booking.getId())
                .qrPayload(qrPayload)
                .qrImageDataUri(qrCodeService.generatePngDataUri(qrPayload, QR_IMAGE_SIZE_PX, QR_IMAGE_SIZE_PX))
                .validFrom(validFrom)
                .validUntil(validUntil)
                .build();
    }

    @Transactional
    public BookingCheckInResultDTO scanBookingCheckIn(OidcUser oidcUser, BookingCheckInScanRequestDTO requestDTO) {
        User actor = currentUserService.requireCurrentUser(oidcUser);
        currentUserService.requireAnyRole(actor, UserRole.ADMIN, UserRole.STAFF);

        String token = extractCheckInToken(requestDTO.getQrPayload());
        Booking booking = bookingRepository.findByQrCheckInToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired booking QR code."));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Booking is not approved for check-in.");
        }

        boolean alreadyCheckedIn = booking.getCheckedInAt() != null;
        if (!alreadyCheckedIn) {
            validateCheckInWindow(booking);
            booking.setCheckedInAt(LocalDateTime.now());
            booking.setCheckedInByUser(actor);
            booking = bookingRepository.save(booking);
        }

        return BookingCheckInResultDTO.builder()
                .booking(toBookingResponse(booking))
                .alreadyCheckedIn(alreadyCheckedIn)
                .build();
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

    private void ensureCanViewBookingQr(User actor, Booking booking) {
        UserRole role = currentUserService.roleOf(actor);
        if (role == UserRole.ADMIN || role == UserRole.STAFF) {
            return;
        }

        if (!booking.getUser().getId().equals(actor.getId())) {
            throw new AccessDeniedException("You do not have access to this booking QR code.");
        }
    }

    private void updateCheckInArtifactsForStatusChange(Booking booking, BookingStatus previousStatus, BookingStatus targetStatus) {
        if (targetStatus == BookingStatus.APPROVED) {
            if (previousStatus != BookingStatus.APPROVED || booking.getQrCheckInToken() == null || booking.getQrCheckInToken().isBlank()) {
                assignNewCheckInToken(booking);
            }
            return;
        }

        booking.setQrCheckInToken(null);
        booking.setQrGeneratedAt(null);
        booking.setCheckedInAt(null);
        booking.setCheckedInByUser(null);
    }

    private void assignNewCheckInToken(Booking booking) {
        booking.setQrCheckInToken(generateUniqueCheckInToken());
        booking.setQrGeneratedAt(LocalDateTime.now());
        booking.setCheckedInAt(null);
        booking.setCheckedInByUser(null);
    }

    private String generateUniqueCheckInToken() {
        String token;
        do {
            token = randomToken();
        } while (bookingRepository.existsByQrCheckInToken(token));
        return token;
    }

    private String randomToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private String buildQrPayload(String token) {
        return QR_CHECK_IN_PREFIX + token;
    }

    private String extractCheckInToken(String payload) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("QR payload is required.");
        }

        String normalized = payload.trim();
        if (normalized.startsWith(QR_CHECK_IN_PREFIX)) {
            normalized = normalized.substring(QR_CHECK_IN_PREFIX.length());
        }

        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Invalid QR payload.");
        }
        return normalized;
    }

    private void validateCheckInWindow(Booking booking) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validFrom = booking.getStartTime().minusMinutes(checkInEarlyMinutes);
        LocalDateTime validUntil = booking.getEndTime().plusMinutes(checkInLateMinutes);

        if (now.isBefore(validFrom)) {
            throw new IllegalStateException("Check-in is not open yet for this booking.");
        }
        if (now.isAfter(validUntil)) {
            throw new IllegalStateException("Check-in window has closed for this booking.");
        }
    }

    private BookingResponseDTO toBookingResponse(Booking booking) {
        boolean checkInQrGenerated = booking.getStatus() == BookingStatus.APPROVED
                && booking.getQrCheckInToken() != null
                && !booking.getQrCheckInToken().isBlank();

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
                .checkInQrGenerated(checkInQrGenerated)
                .checkedInAt(booking.getCheckedInAt())
                .checkedInByName(booking.getCheckedInByUser() == null ? null : booking.getCheckedInByUser().getName())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
