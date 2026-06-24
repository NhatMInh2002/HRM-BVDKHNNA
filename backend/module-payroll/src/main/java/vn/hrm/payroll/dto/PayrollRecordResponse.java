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

        // Thu nhập
        BigDecimal basicSalary,
        BigDecimal totalAllowance,
        BigDecimal taxExemptAllowance,
        BigDecimal bonus,
        BigDecimal otPay,
        BigDecimal grossSalary,

        // Khấu trừ nhân viên
        BigDecimal bhxhEmployee,
        BigDecimal bhytEmployee,
        BigDecimal bhtnEmployee,
        BigDecimal personalDeduction,
        BigDecimal dependentDeduction,
        BigDecimal taxableIncome,
        BigDecimal pit,
        BigDecimal otherDeduction,
        BigDecimal totalDeduction,
        BigDecimal netSalary,

        // Chi phí chủ sử dụng
        BigDecimal bhxhEmployer,
        BigDecimal bhytEmployer,
        BigDecimal bhtnEmployer,
        BigDecimal bhtnldEmployer,
        BigDecimal totalEmployerCost,

        // Chấm công
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
                r.getBasicSalary(), r.getTotalAllowance(),
                orZero(r.getTaxExemptAllowance()), orZero(r.getBonus()),
                r.getOtPay(), r.getGrossSalary(),
                r.getBhxhEmployee(), r.getBhytEmployee(), r.getBhtnEmployee(),
                orZero(r.getPersonalDeduction()), orZero(r.getDependentDeduction()),
                orZero(r.getTaxableIncome()), r.getPit(),
                r.getOtherDeduction(), r.getTotalDeduction(), r.getNetSalary(),
                orZero(r.getBhxhEmployer()), orZero(r.getBhytEmployer()),
                orZero(r.getBhtnEmployer()), orZero(r.getBhtnldEmployer()),
                orZero(r.getTotalEmployerCost()),
                r.getWorkingDays(), r.getActualDays(), r.getOtHours(),
                r.getStatus(), r.getNote(), r.getApprovedBy(), r.getApprovedAt(),
                r.getCreatedAt()
        );
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
