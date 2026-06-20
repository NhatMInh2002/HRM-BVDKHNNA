package vn.hrm.payroll.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.hrm.payroll.dto.GeneratePayrollRequest;
import vn.hrm.payroll.dto.PayrollRecordResponse;
import vn.hrm.payroll.service.PayrollService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    /** Tính lương tháng cho tất cả nhân viên */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String,Integer>>> generate(
            @Valid @RequestBody GeneratePayrollRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = actor(jwt);
        int count = payrollService.generatePeriod(req.year(), req.month(), actor);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("generated", count)));
    }

    /** Danh sách lương tháng */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Page<PayrollRecordResponse>>> list(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                payrollService.listByPeriod(year, month, PageRequest.of(page, size))));
    }

    /** Duyệt phiếu lương */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<PayrollRecordResponse>> approve(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.approve(id, actor(jwt))));
    }

    /** Đánh dấu đã trả lương */
    @PutMapping("/{id}/paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRecordResponse>> markPaid(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.markPaid(id, actor(jwt))));
    }

    /** Nhân viên xem lịch sử lương của mình */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PayrollRecordResponse>>> myPayroll(
            @RequestParam UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.myPayroll(employeeId)));
    }

    private String actor(Jwt jwt) {
        String u = jwt.getClaimAsString("preferred_username");
        return u != null ? u : jwt.getSubject();
    }
}
