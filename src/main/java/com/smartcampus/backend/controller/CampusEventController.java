package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CampusEventCreateRequestDTO;
import com.smartcampus.backend.dto.CampusEventResponseDTO;
import com.smartcampus.backend.dto.CampusEventStatusUpdateRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentDecisionRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentRequestDTO;
import com.smartcampus.backend.dto.EventEnrollmentResponseDTO;
import com.smartcampus.backend.service.CampusEventService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class CampusEventController {

    private final CampusEventService campusEventService;

    @GetMapping
    public Page<CampusEventResponseDTO> listEvents(
            @AuthenticationPrincipal OidcUser oidcUser,
            @RequestParam(defaultValue = "false") boolean mineOnly,
            @PageableDefault(sort = "startsAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return campusEventService.listEvents(oidcUser, pageable, mineOnly);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampusEventResponseDTO createEvent(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody CampusEventCreateRequestDTO requestDTO
    ) {
        return campusEventService.createEvent(oidcUser, requestDTO);
    }

    @PatchMapping("/{id}/status")
    public CampusEventResponseDTO updateEventStatus(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody CampusEventStatusUpdateRequestDTO requestDTO
    ) {
        return campusEventService.updateEventStatus(oidcUser, id, requestDTO);
    }

    @PostMapping("/{id}/enrollments")
    @ResponseStatus(HttpStatus.CREATED)
    public EventEnrollmentResponseDTO requestEnrollment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id,
            @Valid @RequestBody EventEnrollmentRequestDTO requestDTO
    ) {
        return campusEventService.requestEnrollment(oidcUser, id, requestDTO);
    }

    @GetMapping("/enrollments/my")
    public Page<EventEnrollmentResponseDTO> listMyEnrollments(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return campusEventService.listMyEnrollments(oidcUser, pageable);
    }

    @GetMapping("/{id}/enrollments")
    public List<EventEnrollmentResponseDTO> listEventEnrollments(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id
    ) {
        return campusEventService.listEventEnrollments(oidcUser, id);
    }

    @PatchMapping("/{eventId}/enrollments/{enrollmentId}/status")
    public EventEnrollmentResponseDTO reviewEnrollment(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long eventId,
            @PathVariable Long enrollmentId,
            @Valid @RequestBody EventEnrollmentDecisionRequestDTO requestDTO
    ) {
        return campusEventService.reviewEnrollment(oidcUser, eventId, enrollmentId, requestDTO);
    }
}
