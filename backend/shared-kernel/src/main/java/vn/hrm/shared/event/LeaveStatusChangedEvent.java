package vn.hrm.shared.event;

import java.util.UUID;

public record LeaveStatusChangedEvent(
    UUID leaveId,
    UUID employeeId,
    String leaveType,   // LeaveType.name()
    String newStatus,   // LeaveStatus.name(): "APPROVED" | "REJECTED"
    String actorName
) {}
