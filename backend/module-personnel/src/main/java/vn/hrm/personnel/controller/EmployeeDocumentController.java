package vn.hrm.personnel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.dto.EmployeeDocumentResponse;
import vn.hrm.personnel.dto.EmployeeDocumentUploadRequest;
import vn.hrm.personnel.service.EmployeeDocumentService;
import vn.hrm.shared.dto.ApiResponse;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/personnel/employee-documents")
@RequiredArgsConstructor
public class EmployeeDocumentController {

    private final EmployeeDocumentService service;

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<EmployeeDocumentResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByEmployee(employeeId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeDocumentResponse>> register(
            @Valid @RequestBody EmployeeDocumentUploadRequest req, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(service.register(req, principal.getName())));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeDocumentResponse>> verify(
            @PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(service.verify(id, principal.getName())));
    }
}
