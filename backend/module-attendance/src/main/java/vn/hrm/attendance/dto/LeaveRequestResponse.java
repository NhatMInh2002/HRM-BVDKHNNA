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
    String employeeName,
    String employeeCode,
    LeaveType leaveType,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal totalDays,
    String reason,
    String attachmentUrl,
    String attachmentName,
    LeaveStatus status,
    // Cấp 1: Trưởng phòng
    String deptApprovedBy,
    OffsetDateTime deptApprovedAt,
    String deptRejectedBy,
    String deptRejectNote,
    // Cấp 2: TCCB
    String hrApprovedBy,
    OffsetDateTime hrApprovedAt,
    String hrRejectedBy,
    String hrRejectNote,
    // PDF kết quả
    String pdfUrl,
    String createdBy,
    OffsetDateTime createdAt
) {
    public static LeaveRequestResponse from(LeaveRequest r) {
        return from(r, null, null);
    }

    public static LeaveRequestResponse from(LeaveRequest r, String employeeName, String employeeCode) {
        return new LeaveRequestResponse(
            r.getId(),
            r.getEmployeeId(),
            employeeName,
            employeeCode,
            r.getLeaveType(),
            r.getStartDate(),
            r.getEndDate(),
            r.getTotalDays(),
            r.getReason(),
            r.getAttachmentUrl(),
            r.getAttachmentName(),
            r.getStatus(),
            r.getDeptApprovedBy(),
            r.getDeptApprovedAt(),
            r.getDeptRejectedBy(),
            r.getDeptRejectNote(),
            r.getHrApprovedBy(),
            r.getHrApprovedAt(),
            r.getHrRejectedBy(),
            r.getHrRejectNote(),
            r.getPdfUrl(),
            r.getCreatedBy(),
            r.getCreatedAt()
        );
    }
}
