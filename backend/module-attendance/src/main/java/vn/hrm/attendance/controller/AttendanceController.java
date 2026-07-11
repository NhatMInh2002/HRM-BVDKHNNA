package vn.hrm.attendance.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.attendance.dto.AttendanceRecordResponse;
import vn.hrm.attendance.domain.enums.AttendanceStatus;
import vn.hrm.attendance.repository.AttendanceRepository;
import vn.hrm.attendance.service.AttendanceService;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.exception.HrmException;
import vn.hrm.shared.port.DepartmentScopePort;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AttendanceRepository attendanceRepository;
    private final DepartmentScopePort departmentScopePort;

    // Chấm công tự phục vụ (check-in/check-out) đã bỏ — chấm công thực hiện tại
    // máy chấm công đặt trong bệnh viện; dữ liệu đổ trực tiếp vào
    // attendance.attendance_records. Các API dưới chỉ để xem/thống kê.

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<Page<AttendanceRecordResponse>> getDailyAttendance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @PageableDefault(size = 20) Pageable pageable,
        Authentication auth
    ) {
        boolean isDeptManager = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_DEPARTMENT_MANAGER"))
            && auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                             || a.getAuthority().equals("ROLE_HR_MANAGER"));

        if (isDeptManager) {
            UUID deptId = departmentScopePort.getDepartmentIdByEmail(auth.getName());
            if (deptId != null) {
                List<UUID> empIds = departmentScopePort.getEmployeeIdsByDepartmentId(deptId);
                var page = attendanceRepository.findByWorkDateBetweenAndEmployeeIdIn(date, date, empIds, pageable);
                return ApiResponse.ok(page.map(AttendanceRecordResponse::from));
            }
            return ApiResponse.ok(Page.empty(pageable));
        }
        return ApiResponse.ok(attendanceService.getDailyAttendance(date, pageable));
    }

    @GetMapping("/monthly/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','EMPLOYEE')")
    public ApiResponse<List<AttendanceRecordResponse>> getMonthlyReport(
        @PathVariable UUID employeeId,
        @RequestParam int year,
        @RequestParam int month,
        Authentication auth
    ) {
        boolean isManager = auth.getAuthorities().stream()
            .anyMatch(a -> List.of("ROLE_ADMIN","ROLE_HR_MANAGER","ROLE_DEPARTMENT_MANAGER")
                .contains(a.getAuthority()));

        if (!isManager) {
            // employee chỉ xem của chính mình — so sánh bằng employeeId claim trong principal
            // JwtAuthFilter đặt name = email; kiểm tra bằng service nếu cần
        }
        return ApiResponse.ok(attendanceService.getMonthlyReport(employeeId, year, month));
    }

    @GetMapping("/stats/monthly")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<Map<String, Object>> monthlySummary(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        YearMonth ym = (year != null && month != null)
            ? YearMonth.of(year, month)
            : YearMonth.now();

        LocalDate from = ym.atDay(1);
        LocalDate to   = ym.atEndOfMonth();

        long present = attendanceRepository.countByWorkDateBetweenAndStatus(from, to, AttendanceStatus.PRESENT);
        long absent  = attendanceRepository.countByWorkDateBetweenAndStatus(from, to, AttendanceStatus.ABSENT);
        long leave   = attendanceRepository.countByWorkDateBetweenAndStatus(from, to, AttendanceStatus.LEAVE);

        List<Object[]> rows = attendanceRepository.dailySummary(from, to);
        List<Map<String, Object>> daily = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date",    r[0].toString());
            entry.put("present", ((Number) r[1]).longValue());
            entry.put("absent",  ((Number) r[2]).longValue());
            entry.put("leave",   ((Number) r[3]).longValue());
            daily.add(entry);
        }

        return ApiResponse.ok(Map.of(
            "period",  ym.toString(),
            "present", present,
            "absent",  absent,
            "leave",   leave,
            "daily",   daily
        ));
    }
}
