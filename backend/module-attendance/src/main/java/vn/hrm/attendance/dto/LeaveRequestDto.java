package vn.hrm.attendance.dto;

import jakarta.validation.constraints.NotNull;
import vn.hrm.attendance.domain.enums.LeaveType;

import java.time.LocalDate;
import java.util.UUID;

public record LeaveRequestDto(
    @NotNull UUID employeeId,
    @NotNull LeaveType leaveType,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    String reason
) {}
