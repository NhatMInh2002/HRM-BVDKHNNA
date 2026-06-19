package vn.hrm.attendance.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.attendance.domain.AttendanceRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {

    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);

    Page<AttendanceRecord> findByWorkDateBetween(LocalDate from, LocalDate to, Pageable pageable);

    List<AttendanceRecord> findByEmployeeIdAndWorkDateBetween(UUID employeeId, LocalDate from, LocalDate to);
}
