package vn.hrm.payroll.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GeneratePayrollRequest(
        @NotNull @Min(2020) int year,
        @NotNull @Min(1) @Max(12) int month
) {}
