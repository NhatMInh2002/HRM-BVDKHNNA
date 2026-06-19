package vn.hrm.attendance.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;

import java.util.List;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(LeaveStatus status);
}
