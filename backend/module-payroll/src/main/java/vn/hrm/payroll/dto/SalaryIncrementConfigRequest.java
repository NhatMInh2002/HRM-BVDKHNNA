package vn.hrm.payroll.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryIncrementConfigRequest(
        @NotNull UUID employeeId,

        @DecimalMin("0") BigDecimal responsibilityCoefficient,
        @DecimalMin("0") BigDecimal responsibilitySecondaryCoefficient,
        @DecimalMin("0") BigDecimal qualificationCoefficient,
        QualificationAdjustment qualificationAdjustment,

        @DecimalMin("0") BigDecimal concurrentUnionCoefficient,
        @DecimalMin("0") BigDecimal specialtyMultiplierPercent,
        @DecimalMin("0") @DecimalMax("100") BigDecimal concurrentDeptBonusPercent,
        @DecimalMin("0") @DecimalMax("100") BigDecimal concurrentDeptTimePercent,

        String ratingCode,
        @DecimalMin("0") @DecimalMax("100") BigDecimal ratingPercentage,

        Short workdaysActual,
        Short workdaysStandard,
        @DecimalMin("0") BigDecimal paymentMultiplier,

        @NotNull LocalDate effectiveFrom
) {}
