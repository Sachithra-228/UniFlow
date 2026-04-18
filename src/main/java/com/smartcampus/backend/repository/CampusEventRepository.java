package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.CampusEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampusEventRepository extends JpaRepository<CampusEvent, Long> {

    @Override
    @EntityGraph(attributePaths = {"createdBy"})
    Page<CampusEvent> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"createdBy"})
    Page<CampusEvent> findByCreatedById(Long createdById, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CampusEvent e where e.createdBy.id = :userId")
    int deleteByCreatedById(@Param("userId") Long userId);
}
