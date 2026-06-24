package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.domain.enums.Gender;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeResponse(
    UUID id,
    String employeeCode,
    String fullName,
    String email,
    String phone,
    Gender gender,
    LocalDate dateOfBirth,
    LocalDate joinDate,
    EmployeeStatus status,
    ContractType contractType,
    String position,
    String educationLevel,
    String ethnicity,
    String religion,
    String hometown,
    String address,
    DepartmentSummary department,
    ManagerSummary manager,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record DepartmentSummary(UUID id, String code, String name) {}
    public record ManagerSummary(UUID id, String employeeCode, String fullName) {}

    public static EmployeeResponse from(Employee e) {
        return new EmployeeResponse(
            e.getId(), e.getEmployeeCode(), e.getFullName(), e.getEmail(),
            e.getPhone(), e.getGender(), e.getDateOfBirth(), e.getJoinDate(),
            e.getStatus(), e.getContractType(), e.getPosition(),
            e.getEducationLevel(), e.getEthnicity(), e.getReligion(),
            e.getHometown(), e.getAddress(),
            e.getDepartment() == null ? null : new DepartmentSummary(
                e.getDepartment().getId(), e.getDepartment().getCode(), e.getDepartment().getName()),
            e.getManager() == null ? null : new ManagerSummary(
                e.getManager().getId(), e.getManager().getEmployeeCode(), e.getManager().getFullName()),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
