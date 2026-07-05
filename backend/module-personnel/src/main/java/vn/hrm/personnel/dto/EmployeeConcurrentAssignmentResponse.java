package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.EmployeeConcurrentAssignment;
import vn.hrm.personnel.domain.enums.ConcurrentRoleType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeConcurrentAssignmentResponse(
        UUID id,
        UUID employeeId,
        UUID departmentId,
        String departmentName,
        ConcurrentRoleType roleType,
        BigDecimal bonusPercent,     // 10 (BS_DS) hoặc 5 (DD_KTV) — dùng để auto-fill lương tăng thêm
        BigDecimal timePercent,
        String decisionNumber,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String note
) {
    public static EmployeeConcurrentAssignmentResponse from(EmployeeConcurrentAssignment a) {
        return new EmployeeConcurrentAssignmentResponse(
                a.getId(), a.getEmployee().getId(),
                a.getDepartment().getId(), a.getDepartment().getName(),
                a.getRoleType(), a.getRoleType().bonusPercent(), a.getTimePercent(),
                a.getDecisionNumber(), a.getEffectiveFrom(), a.getEffectiveTo(), a.getNote()
        );
    }
}
