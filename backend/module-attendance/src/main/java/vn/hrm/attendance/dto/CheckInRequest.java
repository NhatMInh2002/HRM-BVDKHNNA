package vn.hrm.attendance.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CheckInRequest(
    @NotNull UUID employeeId,
    String note
) {}
