package vn.hrm.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryConfigRequest(
        @NotNull UUID employeeId,
        @NotNull @DecimalMin("0") BigDecimal basicSalary,
        BigDecimal allowanceFood,
        BigDecimal allowanceTransport,
        BigDecimal allowancePhone,
        BigDecimal allowanceOther,
        @DecimalMin("0.01") BigDecimal coefficient,
        @NotNull LocalDate effectiveFrom
) {}
