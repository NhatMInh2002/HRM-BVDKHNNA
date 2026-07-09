package vn.hrm.payroll.dto;

import vn.hrm.payroll.domain.SalaryIncrementConfig;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;
import vn.hrm.payroll.service.SalaryIncrementCalculator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryIncrementConfigResponse(
        UUID id,
        UUID employeeId,

        BigDecimal responsibilityCoefficient,
        BigDecimal responsibilitySecondaryCoefficient,
        BigDecimal responsibilityCoefficientTotal,       // chính + 25% × phụ (tr.50)

        BigDecimal qualificationCoefficient,
        QualificationAdjustment qualificationAdjustment,
        BigDecimal specialtyMultiplierPercent,
        BigDecimal qualificationCoefficientAdjusted,      // qualificationCoefficient × hệ số điều chỉnh × %đặc thù khoa/phòng

        BigDecimal concurrentUnionCoefficient,
        BigDecimal concurrentDeptBonusPercent,
        BigDecimal concurrentDeptTimePercent,
        BigDecimal concurrentDeptCoefficient,              // qualificationCoefficientAdjusted × bonus% × time%

        BigDecimal totalCoefficient,                        // tổng hệ số điều chỉnh TNTT

        String ratingCode,
        BigDecimal ratingPercentage,

        Short workdaysActual,
        Short workdaysStandard,
        BigDecimal paymentMultiplier,

        BigDecimal incrementAmount,     // TNTT dự kiến = lương cơ sở × totalCoefficient × rating% × (ngày công) × số lần chi trả

        String status,                  // DRAFT | APPROVED
        String approvedBy,

        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {
    /** @param baseSalary lương cơ sở tại effective_from (tra từ payroll.base_salary_configs) */
    public static SalaryIncrementConfigResponse from(SalaryIncrementConfig c, BigDecimal baseSalary) {
        SalaryIncrementCalculator.Result r = SalaryIncrementCalculator.compute(c, baseSalary);

        return new SalaryIncrementConfigResponse(
                c.getId(), c.getEmployeeId(),
                c.getResponsibilityCoefficient(), c.getResponsibilitySecondaryCoefficient(), r.responsibilityTotal(),
                c.getQualificationCoefficient(), c.getQualificationAdjustment(), c.getSpecialtyMultiplierPercent(), r.qualificationAdjusted(),
                c.getConcurrentUnionCoefficient(), c.getConcurrentDeptBonusPercent(), c.getConcurrentDeptTimePercent(),
                r.concurrentDeptCoefficient(),
                r.totalCoefficient(),
                c.getRatingCode(), c.getRatingPercentage(),
                c.getWorkdaysActual(), c.getWorkdaysStandard(), c.getPaymentMultiplier(),
                r.incrementAmount(),
                c.getStatus(), c.getApprovedBy(),
                c.getEffectiveFrom(), c.getEffectiveTo()
        );
    }
}
