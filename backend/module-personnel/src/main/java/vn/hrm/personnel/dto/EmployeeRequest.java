package vn.hrm.personnel.dto;

import jakarta.validation.constraints.*;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.domain.enums.Gender;

import java.time.LocalDate;
import java.util.UUID;

public record EmployeeRequest(
    @NotBlank @Size(max = 20) String employeeCode,
    @NotBlank @Size(max = 100) String fullName,
    @Email @Size(max = 100) String email,
    @Size(max = 20) String phone,
    Gender gender,
    LocalDate dateOfBirth,
    String nationalId,
    @NotNull LocalDate joinDate,
    @NotNull ContractType contractType,
    UUID departmentId,
    @Size(max = 100) String position,
    UUID managerId
) {}
