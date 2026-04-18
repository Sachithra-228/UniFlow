package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Ticket;
import com.smartcampus.backend.entity.TicketStatus;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Page<Ticket> findByCreatedById(Long createdById, Pageable pageable);

    Page<Ticket> findByAssignedTechnicianId(Long assignedTechnicianId, Pageable pageable);

    boolean existsByCreatedById(Long createdById);

    boolean existsByAssignedTechnicianId(Long assignedTechnicianId);

    List<Ticket> findAllByCreatedById(Long createdById);

    @Modifying
    @Query("update Ticket t set t.assignedTechnician = null where t.assignedTechnician.id = :userId")
    int clearAssignedTechnicianReferences(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Ticket t set t.resource = null where t.resource.id = :resourceId")
    int clearResourceReferences(@Param("resourceId") Long resourceId);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Optional<Ticket> findByIdAndCreatedById(Long id, Long createdById);

    @Query("""
            SELECT t
            FROM Ticket t
            WHERE t.assignedTechnician.id = :technicianId
               OR (t.assignedTechnician IS NULL AND t.status = com.smartcampus.backend.entity.TicketStatus.OPEN)
            """)
    Page<Ticket> findVisibleToTechnician(@Param("technicianId") Long technicianId, Pageable pageable);
}
