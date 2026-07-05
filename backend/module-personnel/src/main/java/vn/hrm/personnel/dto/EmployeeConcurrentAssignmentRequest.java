package vn.hrm.personnel.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeConcurrentAssignmentRequest(
        @NotNull UUID employeeId,
        @NotNull UUID departmentId,
        @NotNull String roleType,   // BS_DS | DD_KTV
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal timePercent,
        String decisionNumber,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String note
) {}
