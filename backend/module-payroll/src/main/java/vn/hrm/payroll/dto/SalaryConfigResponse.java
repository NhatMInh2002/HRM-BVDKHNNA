package vn.hrm.payroll.dto;

import vn.hrm.payroll.domain.SalaryConfig;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryConfigResponse(
        UUID id,
        UUID employeeId,
        BigDecimal basicSalary,
        BigDecimal coefficient,
        BigDecimal effectiveSalary,      // basicSalary × coefficient

        // Phụ cấp
        BigDecimal allowanceFood,
        BigDecimal allowanceTransport,
        BigDecimal allowancePhone,
        BigDecimal allowancePosition,
        BigDecimal allowanceSeniority,
        BigDecimal allowanceHouse,
        BigDecimal allowanceToxic,
        BigDecimal allowanceOther,
        BigDecimal totalAllowance,       // tổng tất cả phụ cấp

        // Thuế & BHXH
        int dependents,
        boolean bhxhExempt,

        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {
    public static SalaryConfigResponse from(SalaryConfig c) {
        BigDecimal basic     = c.getBasicSalary();
        BigDecimal coeff     = c.getCoefficient() != null ? c.getCoefficient() : BigDecimal.ONE;
        BigDecimal food      = orZero(c.getAllowanceFood());
        BigDecimal transport = orZero(c.getAllowanceTransport());
        BigDecimal phone     = orZero(c.getAllowancePhone());
        BigDecimal position  = orZero(c.getAllowancePosition());
        BigDecimal seniority = orZero(c.getAllowanceSeniority());
        BigDecimal house     = orZero(c.getAllowanceHouse());
        BigDecimal toxic     = orZero(c.getAllowanceToxic());
        BigDecimal other     = orZero(c.getAllowanceOther());
        BigDecimal total     = food.add(transport).add(phone).add(position)
                                   .add(seniority).add(house).add(toxic).add(other);
        return new SalaryConfigResponse(
                c.getId(), c.getEmployeeId(),
                basic, coeff, basic.multiply(coeff),
                food, transport, phone, position, seniority, house, toxic, other, total,
                c.getDependents() != null ? c.getDependents() : 0,
                Boolean.TRUE.equals(c.getBhxhExempt()),
                c.getEffectiveFrom(), c.getEffectiveTo()
        );
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
