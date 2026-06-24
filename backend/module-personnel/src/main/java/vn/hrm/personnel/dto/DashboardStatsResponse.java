package vn.hrm.personnel.dto;

public record DashboardStatsResponse(
        long totalEmployees,
        long activeEmployees,
        long probationEmployees,
        long onLeaveEmployees,
        long terminatedEmployees,
        long totalDepartments
) {}
