package vn.hrm.shared.port;

import java.util.List;
import java.util.UUID;

public interface RoleManagementPort {

    record EmployeeRoleView(
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

    List<EmployeeRoleView> findAllForRoleManagement(String keyword, int page, int size);

    long countAll(String keyword);

    void updateRole(UUID employeeId, String role, String keycloakUsername);
}
