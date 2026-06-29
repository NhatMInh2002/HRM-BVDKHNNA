package vn.hrm.personnel.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.dto.ContractRequest;
import vn.hrm.personnel.dto.ContractResponse;
import vn.hrm.personnel.service.ContractService;
import vn.hrm.shared.dto.ApiResponse;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/personnel/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.getByEmployee(employeeId)));
    }

    @GetMapping("/expiring-soon")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getExpiringSoon(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.getExpiringSoon(days)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<ContractResponse>> create(
            @RequestBody ContractRequest req, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.create(req, principal.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<ContractResponse>> update(
            @PathVariable UUID id, @RequestBody ContractRequest req, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.update(id, req, principal.getName())));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<ContractResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.updateStatus(id, status, principal.getName())));
    }
}
