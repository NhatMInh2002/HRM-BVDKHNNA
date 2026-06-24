package vn.hrm.personnel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.dto.EmployeeRequest;
import vn.hrm.personnel.dto.EmployeeResponse;
import vn.hrm.personnel.service.EmployeeService;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.port.DepartmentScopePort;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/personnel/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final DepartmentScopePort departmentScopePort;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ApiResponse<Page<EmployeeResponse>> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) EmployeeStatus status,
        @RequestParam(required = false) UUID departmentId,
        @PageableDefault(size = 20, sort = "fullName") Pageable pageable,
        @AuthenticationPrincipal Jwt jwt
    ) {
        // DEPARTMENT_MANAGER chỉ thấy nhân viên trong khoa của mình
        List<String> roles = jwt.getClaimAsStringList("roles");
        boolean isDeptManager = roles != null
            && roles.contains("DEPARTMENT_MANAGER")
            && !roles.contains("ADMIN")
            && !roles.contains("HR_MANAGER");

        if (isDeptManager) {
            String email = jwt.getClaimAsString("email");
            if (email == null) email = jwt.getClaimAsString("preferred_username");
            departmentId = departmentScopePort.getDepartmentIdByEmail(email);
        }
        return ApiResponse.ok(employeeService.search(keyword, status, departmentId, pageable));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<EmployeeResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null) email = jwt.getClaimAsString("preferred_username");
        return ApiResponse.ok(employeeService.getByEmail(email));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
    public ApiResponse<EmployeeResponse> getById(@PathVariable UUID id) {
        return ApiResponse.ok(employeeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
        @Valid @RequestBody EmployeeRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String createdBy = jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username") : jwt.getSubject();
        EmployeeResponse response = employeeService.create(req, createdBy);
        return ResponseEntity
            .created(URI.create("/api/personnel/employees/" + response.id()))
            .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ApiResponse<EmployeeResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody EmployeeRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String updatedBy = jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username") : jwt.getSubject();
        return ApiResponse.ok(employeeService.update(id, req, updatedBy));
    }

    @DeleteMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ApiResponse<Void> terminate(
        @PathVariable UUID id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String updatedBy = jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username") : jwt.getSubject();
        employeeService.terminate(id, updatedBy);
        return ApiResponse.ok(null);
    }
}
