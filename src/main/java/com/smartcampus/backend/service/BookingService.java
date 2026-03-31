package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.BookingStatus;
import com.smartcampus.backend.entity.Resource;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
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

    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable).map(this::toBookingResponse);
    }

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO) {
        validateBookingWindow(requestDTO.getStartTime(), requestDTO.getEndTime());

        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", requestDTO.getUserId()));

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
