package vn.hrm.payroll.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.payroll.dto.SalaryConfigRequest;
import vn.hrm.payroll.dto.SalaryConfigResponse;
import vn.hrm.payroll.service.PayrollService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payroll/salary-config")
@RequiredArgsConstructor
public class SalaryConfigController {

    private final PayrollService payrollService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<SalaryConfigResponse>> save(
            @Valid @RequestBody SalaryConfigRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.saveSalaryConfig(req, auth.getName())));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<SalaryConfigResponse>>> history(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getSalaryHistory(employeeId)));
    }

    @GetMapping("/{employeeId}/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SalaryConfigResponse>> current(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getCurrentSalary(employeeId)));
    }
}
