package vn.hrm.app.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.app.admin.dto.RoleAssignmentDto;
import vn.hrm.app.admin.dto.UpdateRoleRequest;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.port.RoleManagementPort;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final RoleManagementPort roleManagementPort;
    private final KeycloakAdminService keycloakAdminService;

    @GetMapping("/role-assignments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> listRoleAssignments(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        List<RoleAssignmentDto> items = roleManagementPort
                .findAllForRoleManagement(keyword, page, size)
                .stream()
                .map(v -> new RoleAssignmentDto(
                        v.id(), v.employeeCode(), v.fullName(), v.email(),
                        v.departmentName(), v.position(),
                        v.keycloakUsername(), v.hrmRole(), v.status()))
                .toList();

        long total = roleManagementPort.countAll(keyword);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "content", items,
                "totalElements", total,
                "page", page,
                "size", size
        )));
    }

    @PutMapping("/role-assignments/{id}")
    public ResponseEntity<ApiResponse<String>> updateRole(
            @PathVariable UUID id,
            @RequestBody UpdateRoleRequest req
    ) {
        // 1. Lưu vào DB
        roleManagementPort.updateRole(id, req.role(), req.keycloakUsername());

        // 2. Sync lên Keycloak nếu có keycloakUsername
        String syncResult = "DB updated";
        if (req.keycloakUsername() != null && !req.keycloakUsername().isBlank()) {
            String userId = keycloakAdminService.findUserId(req.keycloakUsername());
            if (userId != null) {
                boolean ok = keycloakAdminService.assignRole(userId, req.role());
                syncResult = ok ? "DB + Keycloak synced" : "DB updated, Keycloak sync failed";
            } else {
                syncResult = "DB updated, Keycloak user not found";
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(syncResult));
    }
}
