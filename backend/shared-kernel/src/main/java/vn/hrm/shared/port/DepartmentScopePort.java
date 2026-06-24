package vn.hrm.shared.port;

import java.util.List;
import java.util.UUID;

/**
 * Port cho cross-module query: attendance/payroll cần biết nhân viên trong 1 khoa.
 * module-personnel implement, các module khác inject interface này.
 */
public interface DepartmentScopePort {
    /** Trả về departmentId của nhân viên có email này, null nếu chưa gán khoa. */
    UUID getDepartmentIdByEmail(String email);

    /** Trả về danh sách employeeId trong một khoa. */
    List<UUID> getEmployeeIdsByDepartmentId(UUID departmentId);
}
