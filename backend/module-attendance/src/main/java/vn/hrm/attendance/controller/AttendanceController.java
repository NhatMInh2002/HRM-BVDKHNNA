package vn.hrm.attendance.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.hrm.attendance.dto.AttendanceRecordResponse;
import vn.hrm.attendance.dto.CheckInRequest;
import vn.hrm.attendance.dto.CheckOutRequest;
import vn.hrm.attendance.domain.enums.AttendanceStatus;
import vn.hrm.attendance.repository.AttendanceRepository;
import vn.hrm.attendance.service.AttendanceService;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.exception.HrmException;

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

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','EMPLOYEE')")
    public ApiResponse<AttendanceRecordResponse> checkIn(
        @Valid @RequestBody CheckInRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String createdBy = resolveUsername(jwt);
        return ApiResponse.ok(attendanceService.checkIn(req, createdBy));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','EMPLOYEE')")
    public ApiResponse<AttendanceRecordResponse> checkOut(
        @Valid @RequestBody CheckOutRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ApiResponse.ok(attendanceService.checkOut(req.employeeId()));
    }

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<Page<AttendanceRecordResponse>> getDailyAttendance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ApiResponse.ok(attendanceService.getDailyAttendance(date, pageable));
    }

    @GetMapping("/monthly/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','EMPLOYEE')")
    public ApiResponse<List<AttendanceRecordResponse>> getMonthlyReport(
        @PathVariable UUID employeeId,
        @RequestParam int year,
        @RequestParam int month,
        @AuthenticationPrincipal Jwt jwt
    ) {
        // EMPLOYEE chỉ xem của chính mình
        String username = resolveUsername(jwt);
        boolean isAdmin = jwt.getClaimAsStringList("roles") != null &&
            (jwt.getClaimAsStringList("roles").contains("ADMIN") ||
             jwt.getClaimAsStringList("roles").contains("HR_MANAGER") ||
             jwt.getClaimAsStringList("roles").contains("DEPARTMENT_MANAGER"));

        if (!isAdmin) {
            // Lấy subject của jwt để so sánh — trong thực tế cần map employeeId với jwt subject
            // Ở đây enforce bằng cách kiểm tra claim employee_id nếu có
            String jwtEmployeeId = jwt.getClaimAsString("employee_id");
            if (jwtEmployeeId != null && !jwtEmployeeId.equals(employeeId.toString())) {
                throw HrmException.forbidden("Không có quyền xem dữ liệu của nhân viên khác");
            }
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

    private String resolveUsername(Jwt jwt) {
        return jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username")
            : jwt.getSubject();
    }
}
