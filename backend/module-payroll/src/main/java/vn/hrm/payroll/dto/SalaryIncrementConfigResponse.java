package vn.hrm.payroll.dto;

import vn.hrm.payroll.domain.SalaryIncrementConfig;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {
    /** Lương cơ sở từ 01/07/2026 — cùng giá trị dùng trong PayrollService. */
    private static final BigDecimal LUONG_CO_SO = new BigDecimal("2530000");

    public static SalaryIncrementConfigResponse from(SalaryIncrementConfig c) {
        BigDecimal responsibilityTotal = c.getResponsibilityCoefficient()
                .add(c.getResponsibilitySecondaryCoefficient().multiply(new BigDecimal("0.25")))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal qualAdjusted = c.getQualificationCoefficient()
                .multiply(c.getQualificationAdjustment().factor())
                .multiply(c.getSpecialtyMultiplierPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .setScale(4, RoundingMode.HALF_UP);

        // Điều 34.6 (tr.53): HS = gốc + (gốc × %phụ_trội × %thời_gian_kiêm_nhiệm)
        BigDecimal concurrentDeptCoeff = qualAdjusted
                .multiply(c.getConcurrentDeptBonusPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .multiply(c.getConcurrentDeptTimePercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal totalCoeff = responsibilityTotal
                .add(qualAdjusted)
                .add(c.getConcurrentUnionCoefficient())
                .add(concurrentDeptCoeff);

        short actual = c.getWorkdaysActual() != null ? c.getWorkdaysActual() : 22;
        short standard = c.getWorkdaysStandard() != null && c.getWorkdaysStandard() > 0 ? c.getWorkdaysStandard() : 22;

        BigDecimal increment = LUONG_CO_SO
                .multiply(totalCoeff)
                .multiply(c.getRatingPercentage().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP))
                .multiply(BigDecimal.valueOf(actual))
                .divide(BigDecimal.valueOf(standard), 6, RoundingMode.HALF_UP)
                .multiply(c.getPaymentMultiplier())
                .setScale(0, RoundingMode.HALF_UP);

        return new SalaryIncrementConfigResponse(
                c.getId(), c.getEmployeeId(),
                c.getResponsibilityCoefficient(), c.getResponsibilitySecondaryCoefficient(), responsibilityTotal,
                c.getQualificationCoefficient(), c.getQualificationAdjustment(), c.getSpecialtyMultiplierPercent(), qualAdjusted,
                c.getConcurrentUnionCoefficient(), c.getConcurrentDeptBonusPercent(), c.getConcurrentDeptTimePercent(),
                concurrentDeptCoeff,
                totalCoeff,
                c.getRatingCode(), c.getRatingPercentage(),
                c.getWorkdaysActual(), c.getWorkdaysStandard(), c.getPaymentMultiplier(),
                increment,
                c.getEffectiveFrom(), c.getEffectiveTo()
        );
    }
}
