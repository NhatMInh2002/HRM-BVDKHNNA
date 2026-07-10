package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.attendance.domain.AttendanceRecord;
import vn.hrm.attendance.dto.AttendanceRecordResponse;
import vn.hrm.attendance.repository.AttendanceRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final JdbcTemplate jdbc;

    // Chấm công tự phục vụ (checkIn/checkOut) đã bỏ — dữ liệu chấm công do máy
    // chấm công trong bệnh viện đổ vào attendance.attendance_records. Service này
    // chỉ còn phục vụ truy vấn/thống kê.

    public List<AttendanceRecordResponse> getMonthlyReport(UUID employeeId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        return attendanceRepository
            .findByEmployeeIdAndWorkDateBetween(employeeId, from, to)
            .stream()
            .map(AttendanceRecordResponse::from)
            .toList();
    }

    public Page<AttendanceRecordResponse> getDailyAttendance(LocalDate date, Pageable pageable) {
        Page<AttendanceRecord> page = attendanceRepository.findByWorkDateBetween(date, date, pageable);

        List<UUID> employeeIds = page.getContent().stream().map(AttendanceRecord::getEmployeeId).distinct().toList();
        Map<UUID, Object[]> employeeInfo = employeeIds.isEmpty() ? Map.of() : jdbc.query(
            "SELECT id, employee_code, full_name FROM personnel.employees WHERE id = ANY (?)",
            ps -> ps.setArray(1, ps.getConnection().createArrayOf("uuid", employeeIds.toArray())),
            rs -> {
                Map<UUID, Object[]> m = new java.util.HashMap<>();
                while (rs.next()) {
                    m.put(UUID.fromString(rs.getString("id")),
                        new Object[]{ rs.getString("employee_code"), rs.getString("full_name") });
                }
                return m;
            });

        return page.map(r -> {
            Object[] info = employeeInfo.get(r.getEmployeeId());
            String code = info != null ? (String) info[0] : null;
            String name = info != null ? (String) info[1] : null;
            return AttendanceRecordResponse.from(r, code, name);
        });
    }
}
