package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ResourceRequestDTO;
import com.smartcampus.backend.dto.ResourceResponseDTO;
import com.smartcampus.backend.entity.Resource;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE");

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;

    public Page<ResourceResponseDTO> getAllResources(Pageable pageable) {
        return resourceRepository.findAll(pageable).map(this::toResourceResponse);
    }

    public ResourceResponseDTO createResource(ResourceRequestDTO requestDTO) {
        String normalizedName = requestDTO.getName().trim();
        String normalizedLocation = requestDTO.getLocation().trim();
        String normalizedStatus = requestDTO.getStatus().trim().toUpperCase();

        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid resource status");
        }

        if (resourceRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Resource with this name already exists");
        }

        Resource resource = Resource.builder()
                .name(normalizedName)
                .type(requestDTO.getType())
                .capacity(requestDTO.getCapacity())
                .location(normalizedLocation)
                .status(normalizedStatus)
                .availableFrom(LocalTime.of(8, 0))
                .availableTo(LocalTime.of(18, 0))
                .createdAt(LocalDateTime.now())
                .build();

        return toResourceResponse(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO requestDTO) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        String normalizedName = requestDTO.getName().trim();
        String normalizedLocation = requestDTO.getLocation().trim();
        String normalizedStatus = requestDTO.getStatus().trim().toUpperCase();

        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid resource status");
        }

        if (resourceRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new IllegalArgumentException("Resource with this name already exists");
        }

        existing.setName(normalizedName);
        existing.setType(requestDTO.getType());
        existing.setCapacity(requestDTO.getCapacity());
        existing.setLocation(normalizedLocation);
        existing.setStatus(normalizedStatus);

        return toResourceResponse(resourceRepository.save(existing));
    }

    @Transactional
    public void deleteResource(Long id) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        // Keep ticket history but detach the deleted resource from existing tickets.
        ticketRepository.clearResourceReferences(id);
        bookingRepository.deleteByResourceId(id);

        resourceRepository.delete(existing);
    }

    private ResourceResponseDTO toResourceResponse(Resource resource) {
        return ResourceResponseDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus())
                .createdAt(resource.getCreatedAt())
                .build();
    }
}
