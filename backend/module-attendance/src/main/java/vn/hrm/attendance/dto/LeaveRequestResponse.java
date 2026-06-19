package vn.hrm.attendance.dto;

import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.domain.enums.LeaveType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LeaveRequestResponse(
    UUID id,
    UUID employeeId,
    LeaveType leaveType,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal totalDays,
    String reason,
    LeaveStatus status,
    String approvedBy,
    OffsetDateTime approvedAt,
    String createdBy,
    OffsetDateTime createdAt
) {
    public static LeaveRequestResponse from(LeaveRequest r) {
        return new LeaveRequestResponse(
            r.getId(),
            r.getEmployeeId(),
            r.getLeaveType(),
            r.getStartDate(),
            r.getEndDate(),
            r.getTotalDays(),
            r.getReason(),
            r.getStatus(),
            r.getApprovedBy(),
            r.getApprovedAt(),
            r.getCreatedBy(),
            r.getCreatedAt()
        );
    }
}
