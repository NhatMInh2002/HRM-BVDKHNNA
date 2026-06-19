package vn.hrm.attendance.dto;

import vn.hrm.attendance.domain.AttendanceRecord;
import vn.hrm.attendance.domain.enums.AttendanceStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

public record AttendanceRecordResponse(
    UUID id,
    UUID employeeId,
    LocalDate workDate,
    OffsetDateTime checkIn,
    OffsetDateTime checkOut,
    AttendanceStatus status,
    String note,
    Long durationMinutes
) {
    public static AttendanceRecordResponse from(AttendanceRecord r) {
        Long duration = null;
        if (r.getCheckIn() != null && r.getCheckOut() != null) {
            duration = ChronoUnit.MINUTES.between(r.getCheckIn(), r.getCheckOut());
        }
        return new AttendanceRecordResponse(
            r.getId(),
            r.getEmployeeId(),
            r.getWorkDate(),
            r.getCheckIn(),
            r.getCheckOut(),
            r.getStatus(),
            r.getNote(),
            duration
        );
    }
}
