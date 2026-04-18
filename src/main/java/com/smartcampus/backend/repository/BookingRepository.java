package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByUserId(Long userId);
    boolean existsByResourceId(Long resourceId);
    boolean existsByQrCheckInToken(String qrCheckInToken);
    Optional<Booking> findByQrCheckInToken(String qrCheckInToken);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Booking b where b.user.id = :userId")
    int deleteByUserId(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Booking b where b.resource.id = :resourceId")
    int deleteByResourceId(@Param("resourceId") Long resourceId);

    @Override
    @EntityGraph(attributePaths = {"user", "resource"})
    Page<Booking> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "resource"})
    Page<Booking> findByUserId(Long userId, Pageable pageable);

    @Query("""
            SELECT COUNT(b) > 0
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.status IN :blockingStatuses
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            """)
    boolean existsOverlappingBooking(@Param("resourceId") Long resourceId,
                                     @Param("startTime") LocalDateTime startTime,
                                     @Param("endTime") LocalDateTime endTime,
                                     @Param("blockingStatuses") List<BookingStatus> blockingStatuses);
}
