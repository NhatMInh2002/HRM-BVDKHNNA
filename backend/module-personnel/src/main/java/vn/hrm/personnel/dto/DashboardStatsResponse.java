package vn.hrm.personnel.dto;

public record DashboardStatsResponse(
        long totalEmployees,
        long activeEmployees,
        long probationEmployees,
        long terminatedEmployees,
        long totalDepartments
) {}
