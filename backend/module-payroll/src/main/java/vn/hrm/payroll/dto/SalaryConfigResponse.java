package vn.hrm.payroll.dto;

import vn.hrm.payroll.domain.SalaryConfig;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryConfigResponse(
        UUID id,
        UUID employeeId,
        BigDecimal basicSalary,
        BigDecimal allowanceFood,
        BigDecimal allowanceTransport,
        BigDecimal allowancePhone,
        BigDecimal allowanceOther,
        BigDecimal coefficient,
        BigDecimal totalAllowance,
        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {
    public static SalaryConfigResponse from(SalaryConfig c) {
        BigDecimal food      = orZero(c.getAllowanceFood());
        BigDecimal transport = orZero(c.getAllowanceTransport());
        BigDecimal phone     = orZero(c.getAllowancePhone());
        BigDecimal other     = orZero(c.getAllowanceOther());
        BigDecimal total     = food.add(transport).add(phone).add(other);
        return new SalaryConfigResponse(
                c.getId(), c.getEmployeeId(),
                c.getBasicSalary(), food, transport, phone, other,
                c.getCoefficient(), total,
                c.getEffectiveFrom(), c.getEffectiveTo()
        );
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
