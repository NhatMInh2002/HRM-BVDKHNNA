package vn.hrm.personnel.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.dto.DashboardStatsResponse;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.dto.ApiResponse;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> stats() {
        long total      = employeeRepository.count();
        long active     = employeeRepository.countByStatus(EmployeeStatus.ACTIVE);
        long probation  = employeeRepository.countByStatus(EmployeeStatus.PROBATION);
        long onLeave    = employeeRepository.countByStatus(EmployeeStatus.ON_LEAVE);
        long terminated = employeeRepository.countByStatus(EmployeeStatus.TERMINATED);
        long depts      = departmentRepository.count();

        return ResponseEntity.ok(ApiResponse.ok(
            new DashboardStatsResponse(total, active, probation, onLeave, terminated, depts)
        ));
    }
}
