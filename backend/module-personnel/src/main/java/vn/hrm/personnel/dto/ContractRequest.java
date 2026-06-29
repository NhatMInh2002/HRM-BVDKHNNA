package vn.hrm.personnel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContractRequest(
        UUID employeeId,
        String contractNumber,
        String contractType,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate signDate,
        String signerName,
        String position,
        String departmentName,
        BigDecimal baseSalary,
        String salaryGrade,
        BigDecimal salaryCoefficient,
        BigDecimal allowancePosition,
        BigDecimal allowanceSeniority,
        BigDecimal allowanceOther,
        String attachmentUrl,
        String attachmentName,
        String notes
) {}
