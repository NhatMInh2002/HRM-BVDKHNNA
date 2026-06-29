package vn.hrm.app.report;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
public class ReportController {

    private final ReportService reportService;

    /** Headcount theo phòng ban */
    @GetMapping("/headcount")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> headcount() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.headcountByDept()));
    }

    /** Tổng chi phí lương theo phòng ban trong kỳ */
    @GetMapping("/payroll-cost")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> payrollCost(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.payrollCostByDept(year, month)));
    }

    /** Tỉ lệ chuyên cần theo phòng ban */
    @GetMapping("/attendance-summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> attendanceSummary(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.attendanceSummary(year, month)));
    }

    /** Tổng hợp dashboard báo cáo */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> overview(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.overview(year, month)));
    }

    /** Số dư phép năm của nhân viên */
    @GetMapping("/leave-balance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> leaveBalance(
            @RequestParam int year,
            @RequestParam(required = false) String departmentId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.leaveBalance(year, departmentId)));
    }
}
