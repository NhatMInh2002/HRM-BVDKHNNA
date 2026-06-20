package vn.hrm.payroll.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.hrm.payroll.dto.GeneratePayrollRequest;
import vn.hrm.payroll.dto.PayrollRecordResponse;
import vn.hrm.payroll.service.PayrollService;
import vn.hrm.payroll.service.PayslipPdfService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayslipPdfService payslipPdfService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String,Integer>>> generate(
            @Valid @RequestBody GeneratePayrollRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        int count = payrollService.generatePeriod(req.year(), req.month(), actor(jwt));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("generated", count)));
    }

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

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<PayrollRecordResponse>> approve(
            @PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.approve(id, actor(jwt))));
    }

    @PutMapping("/{id}/paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRecordResponse>> markPaid(
            @PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.ok(payrollService.markPaid(id, actor(jwt))));
    }

    /** Download phiếu lương PDF */
    @GetMapping("/{id}/payslip.pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable UUID id) throws Exception {
        byte[] pdf = payslipPdfService.generatePayslip(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("phieu-luong-" + id + ".pdf").build().toString())
                .body(pdf);
    }

    /** Export Excel bảng lương tháng */
    @GetMapping("/export.xlsx")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam int year, @RequestParam int month) throws Exception {
        byte[] xlsx = payslipPdfService.exportExcel(year, month);
        String filename = "bang-luong-" + month + "-" + year + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(xlsx);
    }

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
