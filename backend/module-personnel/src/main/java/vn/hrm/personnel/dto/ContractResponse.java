package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.Contract;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ContractResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeCode,
        String contractNumber,
        String contractType,
        String status,
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
        BigDecimal totalSalary,
        String attachmentUrl,
        String attachmentName,
        String notes,
        String createdBy,
        LocalDateTime createdAt
) {
    public static ContractResponse from(Contract c) {
        BigDecimal base  = c.getBaseSalary()          != null ? c.getBaseSalary()          : BigDecimal.ZERO;
        BigDecimal coeff = c.getSalaryCoefficient()   != null ? c.getSalaryCoefficient()   : BigDecimal.ONE;
        BigDecimal ap    = c.getAllowancePosition()    != null ? c.getAllowancePosition()    : BigDecimal.ZERO;
        BigDecimal as_   = c.getAllowanceSeniority()   != null ? c.getAllowanceSeniority()   : BigDecimal.ZERO;
        BigDecimal ao    = c.getAllowanceOther()       != null ? c.getAllowanceOther()       : BigDecimal.ZERO;
        BigDecimal total = base.multiply(coeff).add(ap).add(as_).add(ao);

        return new ContractResponse(
                c.getId(),
                c.getEmployee().getId(),
                c.getEmployee().getFullName(),
                c.getEmployee().getEmployeeCode(),
                c.getContractNumber(),
                c.getContractType().name(),
                c.getStatus().name(),
                c.getStartDate(),
                c.getEndDate(),
                c.getSignDate(),
                c.getSignerName(),
                c.getPosition(),
                c.getDepartmentName(),
                c.getBaseSalary(),
                c.getSalaryGrade(),
                c.getSalaryCoefficient(),
                c.getAllowancePosition(),
                c.getAllowanceSeniority(),
                c.getAllowanceOther(),
                total,
                c.getAttachmentUrl(),
                c.getAttachmentName(),
                c.getNotes(),
                c.getCreatedBy(),
                c.getCreatedAt()
        );
    }
}
