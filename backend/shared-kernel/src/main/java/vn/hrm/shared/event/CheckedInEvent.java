package vn.hrm.shared.event;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CheckedInEvent(
    UUID employeeId,
    OffsetDateTime checkInTime
) {}
