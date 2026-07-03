package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.attendance.domain.AttendanceRecord;
import vn.hrm.attendance.domain.enums.AttendanceStatus;
import vn.hrm.attendance.dto.AttendanceRecordResponse;
import vn.hrm.attendance.dto.CheckInRequest;
import vn.hrm.attendance.repository.AttendanceRepository;
import vn.hrm.shared.event.CheckedInEvent;
import vn.hrm.shared.exception.HrmException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final JdbcTemplate jdbc;

    @Transactional
    public AttendanceRecordResponse checkIn(CheckInRequest req, String createdBy) {
        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndWorkDate(req.employeeId(), today).isPresent()) {
            throw HrmException.badRequest("ALREADY_CHECKED_IN",
                "Nhân viên đã check-in hôm nay: " + req.employeeId());
        }

        OffsetDateTime now = OffsetDateTime.now();
        // Giờ vào muộn hơn 08:00 Asia/Ho_Chi_Minh → LATE
        LocalTime checkInLocal = now.atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalTime();
        AttendanceStatus status = checkInLocal.isAfter(LocalTime.of(8, 0))
                ? AttendanceStatus.LATE
                : AttendanceStatus.PRESENT;

        AttendanceRecord record = AttendanceRecord.builder()
            .employeeId(req.employeeId())
            .workDate(today)
            .checkIn(now)
            .status(status)
            .note(req.note())
            .createdBy(createdBy)
            .build();

        AttendanceRecord saved = attendanceRepository.save(record);
        eventPublisher.publishEvent(new CheckedInEvent(saved.getEmployeeId(), saved.getCheckIn()));
        return AttendanceRecordResponse.from(saved);
    }

    @Transactional
    public AttendanceRecordResponse checkOut(UUID employeeId) {
        LocalDate today = LocalDate.now();
        AttendanceRecord record = attendanceRepository
            .findByEmployeeIdAndWorkDate(employeeId, today)
            .orElseThrow(() -> HrmException.notFound("ATTENDANCE_NOT_FOUND",
                "Chưa check-in hôm nay: " + employeeId));

        if (record.getCheckOut() != null) {
            throw HrmException.badRequest("ALREADY_CHECKED_OUT",
                "Nhân viên đã check-out hôm nay: " + employeeId);
        }

        OffsetDateTime checkOutTime = OffsetDateTime.now();
        record.setCheckOut(checkOutTime);

        // Tính thời gian làm (phút)
        if (record.getCheckIn() != null) {
            long mins = java.time.Duration.between(record.getCheckIn(), checkOutTime).toMinutes();
            if (mins > 0) record.setDurationMinutes((int) mins);
        }

        return AttendanceRecordResponse.from(attendanceRepository.save(record));
    }

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
