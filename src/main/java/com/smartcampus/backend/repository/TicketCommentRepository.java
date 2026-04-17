package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    Optional<TicketComment> findByIdAndTicketId(Long id, Long ticketId);
}

