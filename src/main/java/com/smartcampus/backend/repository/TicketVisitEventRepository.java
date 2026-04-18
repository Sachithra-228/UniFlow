package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.TicketVisitEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketVisitEventRepository extends JpaRepository<TicketVisitEvent, Long> {
    List<TicketVisitEvent> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    List<TicketVisitEvent> findByTicketIdInOrderByCreatedAtAsc(List<Long> ticketIds);

    @Modifying
    @Query("delete from TicketVisitEvent e where e.technician.id = :userId")
    int deleteByTechnicianId(@Param("userId") Long userId);
}

