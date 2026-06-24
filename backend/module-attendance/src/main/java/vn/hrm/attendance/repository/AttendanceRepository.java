package vn.hrm.attendance.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.hrm.attendance.domain.AttendanceRecord;
import vn.hrm.attendance.domain.enums.AttendanceStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {

    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);

    Page<AttendanceRecord> findByWorkDateBetween(LocalDate from, LocalDate to, Pageable pageable);

    List<AttendanceRecord> findByEmployeeIdAndWorkDateBetween(UUID employeeId, LocalDate from, LocalDate to);

    long countByWorkDateBetweenAndStatus(LocalDate from, LocalDate to, AttendanceStatus status);

    @Query("""
        SELECT a.workDate AS workDate,
               SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent,
               SUM(CASE WHEN a.status = 'LEAVE'   THEN 1 ELSE 0 END) AS leave
        FROM AttendanceRecord a
        WHERE a.workDate BETWEEN :from AND :to
        GROUP BY a.workDate
        ORDER BY a.workDate
    """)
    List<Object[]> dailySummary(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
