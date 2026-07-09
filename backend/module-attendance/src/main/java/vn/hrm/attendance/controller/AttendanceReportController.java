package vn.hrm.attendance.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.attendance.service.AttendanceExcelService;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 10 báo cáo Excel chấm công — Phòng TCCB.
 * Tất cả trả file .xlsx (Content-Disposition: attachment).
 */
@RestController
@RequestMapping("/attendance/export")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class AttendanceReportController {

    private final AttendanceExcelService excel;

    /** 1. Bảng chấm công tháng toàn viện (mẫu 01a-LĐTL) */
    @GetMapping("/monthly-grid.xlsx")
    public ResponseEntity<byte[]> monthlyGrid(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.monthlyGrid(year, month, null), "cham-cong-toan-vien-" + month + "-" + year);
    }

    /** 2. Bảng chấm công tháng theo khoa/phòng */
    @GetMapping("/department-grid.xlsx")
    public ResponseEntity<byte[]> departmentGrid(@RequestParam int year, @RequestParam int month,
                                                 @RequestParam UUID departmentId) throws Exception {
        return xlsx(excel.monthlyGrid(year, month, departmentId), "cham-cong-khoa-phong-" + month + "-" + year);
    }

    /** 3. Đi muộn / về sớm */
    @GetMapping("/late-early.xlsx")
    public ResponseEntity<byte[]> lateEarly(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.lateEarly(year, month), "di-muon-ve-som-" + month + "-" + year);
    }

    /** 4. Vắng mặt không phép */
    @GetMapping("/unexcused-absence.xlsx")
    public ResponseEntity<byte[]> unexcusedAbsence(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.unexcusedAbsence(year, month), "vang-khong-phep-" + month + "-" + year);
    }

    /** 5. Làm thêm giờ (OT) */
    @GetMapping("/overtime.xlsx")
    public ResponseEntity<byte[]> overtime(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.overtime(year, month), "tang-ca-" + month + "-" + year);
    }

    /** 6. Nghỉ phép đã duyệt theo loại */
    @GetMapping("/leave-by-type.xlsx")
    public ResponseEntity<byte[]> leaveByType(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.leaveByType(year, month), "nghi-phep-theo-loai-" + month + "-" + year);
    }

    /** 7. Số dư phép năm */
    @GetMapping("/leave-balance.xlsx")
    public ResponseEntity<byte[]> leaveBalance(@RequestParam int year) throws Exception {
        return xlsx(excel.leaveBalance(year), "so-du-phep-" + year);
    }

    /** 8. Đối soát ngày công chấm công ↔ bảng lương */
    @GetMapping("/payroll-reconciliation.xlsx")
    public ResponseEntity<byte[]> payrollReconciliation(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.payrollReconciliation(year, month), "doi-soat-cong-luong-" + month + "-" + year);
    }

    /** 9. So sánh chuyên cần giữa khoa/phòng */
    @GetMapping("/dept-comparison.xlsx")
    public ResponseEntity<byte[]> deptComparison(@RequestParam int year, @RequestParam int month) throws Exception {
        return xlsx(excel.deptComparison(year, month), "so-sanh-chuyen-can-" + month + "-" + year);
    }

    /** 10. Chi tiết chấm công 1 nhân viên theo khoảng thời gian */
    @GetMapping("/employee-detail.xlsx")
    public ResponseEntity<byte[]> employeeDetail(
            @RequestParam UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) throws Exception {
        return xlsx(excel.employeeDetail(employeeId, from, to), "chi-tiet-cham-cong");
    }

    private ResponseEntity<byte[]> xlsx(byte[] bytes, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}
