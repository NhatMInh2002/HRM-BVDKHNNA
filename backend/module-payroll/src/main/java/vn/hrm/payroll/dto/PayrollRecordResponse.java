package vn.hrm.payroll.dto;

import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.domain.enums.PayrollStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PayrollRecordResponse(
        UUID id,
        UUID employeeId,
        int periodYear,
        int periodMonth,
        BigDecimal basicSalary,
        BigDecimal totalAllowance,
        BigDecimal otPay,
        BigDecimal grossSalary,
        BigDecimal bhxhEmployee,
        BigDecimal bhytEmployee,
        BigDecimal bhtnEmployee,
        BigDecimal pit,
        BigDecimal otherDeduction,
        BigDecimal totalDeduction,
        BigDecimal netSalary,
        int workingDays,
        int actualDays,
        BigDecimal otHours,
        PayrollStatus status,
        String note,
        String approvedBy,
        LocalDateTime approvedAt,
        LocalDateTime createdAt
) {
    public static PayrollRecordResponse from(PayrollRecord r) {
        return new PayrollRecordResponse(
                r.getId(), r.getEmployeeId(),
                r.getPeriodYear(), r.getPeriodMonth(),
                r.getBasicSalary(), r.getTotalAllowance(), r.getOtPay(), r.getGrossSalary(),
                r.getBhxhEmployee(), r.getBhytEmployee(), r.getBhtnEmployee(), r.getPit(),
                r.getOtherDeduction(), r.getTotalDeduction(), r.getNetSalary(),
                r.getWorkingDays(), r.getActualDays(), r.getOtHours(),
                r.getStatus(), r.getNote(), r.getApprovedBy(), r.getApprovedAt(),
                r.getCreatedAt()
        );
    }
}
