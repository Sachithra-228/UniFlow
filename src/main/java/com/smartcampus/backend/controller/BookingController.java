package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.dto.BookingCheckInQrResponseDTO;
import com.smartcampus.backend.dto.BookingCheckInResultDTO;
import com.smartcampus.backend.dto.BookingCheckInScanRequestDTO;
import com.smartcampus.backend.dto.BookingStatusUpdateRequestDTO;
import com.smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public Page<BookingResponseDTO> getBookings(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return bookingService.getAllBookings(oidcUser, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponseDTO createBooking(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody BookingRequestDTO requestDTO
    ) {
        return bookingService.createBooking(oidcUser, requestDTO);
    }

    @PatchMapping("/{id}/status")
    public BookingResponseDTO updateBookingStatus(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateRequestDTO requestDTO
    ) {
        return bookingService.updateBookingStatus(oidcUser, id, requestDTO);
    }

    @GetMapping("/{id}/check-in/qr")
    public BookingCheckInQrResponseDTO getBookingCheckInQrCode(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id
    ) {
        return bookingService.getBookingCheckInQrCode(oidcUser, id);
    }

    @PostMapping("/check-in/scan")
    public BookingCheckInResultDTO scanBookingCheckIn(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody BookingCheckInScanRequestDTO requestDTO
    ) {
        return bookingService.scanBookingCheckIn(oidcUser, requestDTO);
    }
}
