package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Ticket;
import com.smartcampus.backend.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Page<Ticket> findByCreatedById(Long createdById, Pageable pageable);

    Page<Ticket> findByAssignedTechnicianId(Long assignedTechnicianId, Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Optional<Ticket> findByIdAndCreatedById(Long id, Long createdById);
}

