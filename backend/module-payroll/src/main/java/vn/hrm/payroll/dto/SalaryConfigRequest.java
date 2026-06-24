package vn.hrm.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryConfigRequest(
        @NotNull UUID employeeId,
        @NotNull @DecimalMin("0") BigDecimal basicSalary,

        // Phụ cấp chịu thuế một phần
        BigDecimal allowanceFood,        // miễn thuế ≤730K, phần vượt chịu thuế
        BigDecimal allowanceTransport,
        BigDecimal allowancePhone,

        // Phụ cấp chịu thuế hoàn toàn
        BigDecimal allowancePosition,    // phụ cấp chức vụ
        BigDecimal allowanceSeniority,   // phụ cấp thâm niên
        BigDecimal allowanceHouse,       // phụ cấp nhà ở
        BigDecimal allowanceOther,

        // Phụ cấp miễn thuế & miễn BHXH
        BigDecimal allowanceToxic,       // phụ cấp độc hại/nguy hiểm

        @DecimalMin("0.01") BigDecimal coefficient,

        @Min(0) Integer dependents,      // số người phụ thuộc đăng ký giảm trừ TNCN

        Boolean bhxhExempt,              // không thuộc đối tượng đóng BHXH

        @NotNull LocalDate effectiveFrom
) {}
