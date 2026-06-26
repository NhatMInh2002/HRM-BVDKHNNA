package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public AttendanceRecordResponse checkIn(CheckInRequest req, String createdBy) {
        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndWorkDate(req.employeeId(), today).isPresent()) {
            throw HrmException.badRequest("ALREADY_CHECKED_IN",
                "Nhân viên đã check-in hôm nay: " + req.employeeId());
        }

        AttendanceRecord record = AttendanceRecord.builder()
            .employeeId(req.employeeId())
            .workDate(today)
            .checkIn(OffsetDateTime.now())
            .status(AttendanceStatus.PRESENT)
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

        record.setCheckOut(OffsetDateTime.now());
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
        return attendanceRepository
            .findByWorkDateBetween(date, date, pageable)
            .map(AttendanceRecordResponse::from);
    }
}
