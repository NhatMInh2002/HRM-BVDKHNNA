package vn.hrm.personnel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.dto.EmployeeConcurrentAssignmentRequest;
import vn.hrm.personnel.dto.EmployeeConcurrentAssignmentResponse;
import vn.hrm.personnel.service.EmployeeConcurrentAssignmentService;
import vn.hrm.shared.dto.ApiResponse;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/personnel/concurrent-assignments")
@RequiredArgsConstructor
public class EmployeeConcurrentAssignmentController {

    private final EmployeeConcurrentAssignmentService service;

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<EmployeeConcurrentAssignmentResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByEmployee(employeeId)));
    }

    @GetMapping("/employee/{employeeId}/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeConcurrentAssignmentResponse>> getCurrent(
            @PathVariable UUID employeeId) {
        return service.getCurrent(employeeId)
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.ok(null)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeConcurrentAssignmentResponse>> create(
            @Valid @RequestBody EmployeeConcurrentAssignmentRequest req, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(req, principal.getName())));
    }

    @PatchMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> end(@PathVariable UUID id) {
        service.end(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
