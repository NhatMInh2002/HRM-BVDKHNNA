package vn.hrm.app.admin.dto;

import java.util.UUID;

public record RoleAssignmentDto(
        UUID id,
        String employeeCode,
        String fullName,
        String email,
        String departmentName,
        String position,
        String keycloakUsername,
        String hrmRole,
        String status
) {}
