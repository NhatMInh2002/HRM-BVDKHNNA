package vn.hrm.personnel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.dto.EmployeeRequest;
import vn.hrm.personnel.dto.EmployeeResponse;
import vn.hrm.personnel.service.EmployeeExcelService;
import vn.hrm.personnel.service.EmployeeService;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.port.DepartmentScopePort;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/personnel/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeExcelService employeeExcelService;
    private final DepartmentScopePort departmentScopePort;

    private String emailFrom(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ApiResponse<Page<EmployeeResponse>> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) EmployeeStatus status,
        @RequestParam(required = false) UUID departmentId,
        @PageableDefault(size = 20, sort = "fullName") Pageable pageable,
        Authentication auth
    ) {
        boolean isDeptManager = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_DEPARTMENT_MANAGER"))
            && auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                             || a.getAuthority().equals("ROLE_HR_MANAGER"));

        if (isDeptManager) {
            departmentId = departmentScopePort.getDepartmentIdByEmail(emailFrom(auth));
        }
        return ApiResponse.ok(employeeService.search(keyword, status, departmentId, pageable));
    }

    @GetMapping("/export.xlsx")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<byte[]> exportExcel(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) EmployeeStatus status,
        @RequestParam(required = false) UUID departmentId,
        Authentication auth
    ) throws Exception {
        boolean isDeptManager = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_DEPARTMENT_MANAGER"))
            && auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                             || a.getAuthority().equals("ROLE_HR_MANAGER"));

        if (isDeptManager) {
            departmentId = departmentScopePort.getDepartmentIdByEmail(emailFrom(auth));
        }

        byte[] xlsx = employeeExcelService.exportExcel(keyword, status, departmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("danh-sach-nhan-vien.xlsx").build().toString())
                .body(xlsx);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<EmployeeResponse> getMe(Authentication auth) {
        return ApiResponse.ok(employeeService.getByEmail(emailFrom(auth)));
    }

    @PutMapping("/me/phone")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> updateMyPhone(
        @RequestBody Map<String, String> body,
        Authentication auth
    ) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Thiếu số điện thoại");
        }
        employeeService.updatePhone(emailFrom(auth), phone.trim());
        return ApiResponse.ok(null);
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
        Authentication auth
    ) {
        EmployeeResponse response = employeeService.create(req, emailFrom(auth));
        return ResponseEntity
            .created(URI.create("/api/personnel/employees/" + response.id()))
            .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ApiResponse<EmployeeResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody EmployeeRequest req,
        Authentication auth
    ) {
        return ApiResponse.ok(employeeService.update(id, req, emailFrom(auth)));
    }

    @DeleteMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ApiResponse<Void> terminate(
        @PathVariable UUID id,
        Authentication auth
    ) {
        employeeService.terminate(id, emailFrom(auth));
        return ApiResponse.ok(null);
    }
}
