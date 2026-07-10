package vn.hrm.payroll.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.payroll.dto.IncrementCoefficientOptionsResponse;
import vn.hrm.payroll.dto.SalaryIncrementConfigRequest;
import vn.hrm.payroll.dto.SalaryIncrementConfigResponse;
import vn.hrm.payroll.service.PayrollService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payroll/salary-increment")
@RequiredArgsConstructor
public class SalaryIncrementConfigController {

    private final PayrollService payrollService;

    @GetMapping("/coefficients")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<IncrementCoefficientOptionsResponse>> coefficients() {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getIncrementCoefficientOptions()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<SalaryIncrementConfigResponse>> save(
            @Valid @RequestBody SalaryIncrementConfigRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.saveSalaryIncrementConfig(req, auth.getName())));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<SalaryIncrementConfigResponse>>> history(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getSalaryIncrementHistory(employeeId)));
    }

    @GetMapping("/{employeeId}/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SalaryIncrementConfigResponse>> current(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getCurrentSalaryIncrement(employeeId)));
    }

    /** Duyệt cấu hình TNTT — chỉ APPROVED mới được tính vào bảng lương. */
    @PutMapping("/config/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<SalaryIncrementConfigResponse>> approve(
            @PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.approveSalaryIncrement(id, auth.getName())));
    }
}
