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
                        v.hrmRole(), v.status()))
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
        roleManagementPort.updateRole(id, req.role());
        return ResponseEntity.ok(ApiResponse.ok("Role updated"));
    }
}
