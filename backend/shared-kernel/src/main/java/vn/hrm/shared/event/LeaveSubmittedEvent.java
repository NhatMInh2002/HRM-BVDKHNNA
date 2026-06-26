package vn.hrm.shared.event;

import java.time.LocalDate;
import java.util.UUID;

public record LeaveSubmittedEvent(
    UUID leaveId,
    UUID employeeId,
    String leaveType,   // LeaveType.name()
    LocalDate startDate,
    LocalDate endDate,
    int totalDays
) {}
