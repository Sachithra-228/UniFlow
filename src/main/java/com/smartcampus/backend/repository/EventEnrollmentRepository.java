package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.EventEnrollment;
import com.smartcampus.backend.entity.EventEnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventEnrollmentRepository extends JpaRepository<EventEnrollment, Long> {

    @EntityGraph(attributePaths = {"event", "event.createdBy", "student", "reviewedBy"})
    Optional<EventEnrollment> findByIdAndEventId(Long id, Long eventId);

    @EntityGraph(attributePaths = {"event", "event.createdBy", "student", "reviewedBy"})
    Optional<EventEnrollment> findByEventIdAndStudentId(Long eventId, Long studentId);

    @EntityGraph(attributePaths = {"event", "event.createdBy", "student", "reviewedBy"})
    Page<EventEnrollment> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    @EntityGraph(attributePaths = {"event", "event.createdBy", "student", "reviewedBy"})
    List<EventEnrollment> findByEventIdOrderByCreatedAtDesc(Long eventId);

    long countByEventIdAndStatus(Long eventId, EventEnrollmentStatus status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from EventEnrollment ee where ee.student.id = :studentId")
    int deleteByStudentId(@Param("studentId") Long studentId);
}
