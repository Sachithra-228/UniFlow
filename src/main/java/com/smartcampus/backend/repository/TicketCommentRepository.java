package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    boolean existsByAuthorId(Long authorId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from TicketComment tc where tc.author.id = :authorId")
    int deleteByAuthorId(@Param("authorId") Long authorId);

    Optional<TicketComment> findByIdAndTicketId(Long id, Long ticketId);
}
