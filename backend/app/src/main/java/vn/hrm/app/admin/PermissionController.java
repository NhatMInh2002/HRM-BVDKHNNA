package vn.hrm.app.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.EmployeePermission;
import vn.hrm.personnel.repository.EmployeePermissionRepository;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.audit.AuditLogService;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.security.Permissions;

import java.lang.reflect.Field;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/admin/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasAuthority('SYSTEM_PERMISSION')")
public class PermissionController {

    private final EmployeeRepository employeeRepo;
    private final EmployeePermissionRepository permRepo;
    private final AuditLogService auditLog;

    /** Lấy danh sách nhân viên theo phòng ban (để hiển thị tree) */
    @GetMapping("/employees")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<DeptWithEmployees>>> getEmployeesGroupedByDept() {
        // Dùng findAllActive để JOIN FETCH department, tránh LazyInitializationException
        List<Employee> all = employeeRepo.findAllActive(PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        Map<String, List<EmployeeSummary>> map = new LinkedHashMap<>();
        map.put("__NO_DEPT__", new ArrayList<>());

        all.stream()
            .sorted(Comparator.comparing(e -> e.getDepartment() == null ? "" : e.getDepartment().getName()))
            .forEach(e -> {
                String deptName = e.getDepartment() != null ? e.getDepartment().getName() : "__NO_DEPT__";
                String deptId   = e.getDepartment() != null ? e.getDepartment().getId().toString() : null;
                map.computeIfAbsent(deptName, k -> new ArrayList<>())
                   .add(new EmployeeSummary(
                       e.getId().toString(),
                       e.getEmployeeCode(),
                       e.getFullName(),
                       e.getPosition(),
                       deptId,
                       deptName,
                       new ArrayList<>(permRepo.findPermissionsByEmployeeId(e.getId()))
                   ));
            });

        List<DeptWithEmployees> result = map.entrySet().stream()
            .filter(en -> !en.getValue().isEmpty())
            .map(en -> new DeptWithEmployees(
                en.getKey().equals("__NO_DEPT__") ? null : en.getKey(),
                en.getValue()
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Lấy permissions của một nhân viên */
    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<ApiResponse<List<String>>> getEmployeePermissions(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(
            new ArrayList<>(permRepo.findPermissionsByEmployeeId(employeeId))
        ));
    }

    /** Gán permissions cho một nhân viên (thay thế toàn bộ) */
    @PutMapping("/employees/{employeeId}")
    @Transactional
    public ResponseEntity<ApiResponse<List<String>>> setEmployeePermissions(
            @PathVariable UUID employeeId,
            @RequestBody List<String> permissions,
            Principal principal) {

        Set<String> valid = getAllPermissionCodes();
        List<String> filtered = permissions.stream()
            .filter(valid::contains)
            .distinct()
            .toList();

        List<String> before = new ArrayList<>(permRepo.findPermissionsByEmployeeId(employeeId));
        permRepo.deleteAllByEmployeeId(employeeId);
        String grantedBy = principal != null ? principal.getName() : "system";

        filtered.forEach(perm -> {
            EmployeePermission ep = new EmployeePermission();
            ep.setEmployeeId(employeeId);
            ep.setPermission(perm);
            ep.setGrantedBy(grantedBy);
            permRepo.save(ep);
        });

        // Cập nhật hrmRole dựa trên permissions (backward compat)
        employeeRepo.findById(employeeId).ifPresent(emp -> {
            String role = deriveRole(filtered);
            emp.setHrmRole(role);
            employeeRepo.save(emp);
        });

        auditLog.record(null, grantedBy, null, "UPDATE", "PERMISSION", employeeId.toString(),
            Map.of("permissions", before), Map.of("permissions", filtered));

        return ResponseEntity.ok(ApiResponse.ok(filtered));
    }

    /** Danh sách tất cả permission codes và metadata */
    @GetMapping("/definitions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PermGroup>>> getDefinitions() {
        return ResponseEntity.ok(ApiResponse.ok(PERMISSION_GROUPS));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private Set<String> getAllPermissionCodes() {
        Set<String> codes = new HashSet<>();
        for (Field f : Permissions.class.getDeclaredFields()) {
            if (f.getType() == String.class) {
                try { codes.add((String) f.get(null)); } catch (Exception ignored) {}
            }
        }
        return codes;
    }

    private String deriveRole(List<String> perms) {
        if (perms.contains(Permissions.SYSTEM_ADMIN))      return "ADMIN";
        if (perms.contains(Permissions.LEAVE_APPROVE_HR))  return "HR_MANAGER";
        if (perms.contains(Permissions.LEAVE_APPROVE_DEPT)) return "DEPT_HEAD";
        if (perms.contains(Permissions.LEAVE_APPROVE_NURSE)) return "NURSE_MANAGER";
        if (perms.contains(Permissions.PAYROLL_MANAGE))    return "ACCOUNTANT";
        return "EMPLOYEE";
    }

    // ── DTOs ──────────────────────────────────────────────────────────

    public record EmployeeSummary(
        String id, String code, String fullName, String position,
        String departmentId, String departmentName, List<String> permissions
    ) {}

    public record DeptWithEmployees(String departmentName, List<EmployeeSummary> employees) {}

    public record PermItem(String code, String label) {}
    public record PermGroup(String group, List<PermItem> items) {}

    static final List<PermGroup> PERMISSION_GROUPS = List.of(
        new PermGroup("Nhân sự", List.of(
            new PermItem(Permissions.PERSONNEL_VIEW,   "Xem danh sách nhân viên"),
            new PermItem(Permissions.PERSONNEL_EDIT,   "Sửa hồ sơ nhân viên"),
            new PermItem(Permissions.PERSONNEL_EXPORT, "Xuất Excel nhân sự")
        )),
        new PermGroup("Chấm công", List.of(
            new PermItem(Permissions.ATTENDANCE_VIEW,   "Xem bảng chấm công"),
            new PermItem(Permissions.ATTENDANCE_MANAGE, "Quản lý chấm công")
        )),
        new PermGroup("Nghỉ phép", List.of(
            new PermItem(Permissions.LEAVE_APPROVE_DEPT,  "Duyệt cấp 1 (Trưởng khoa/phòng)"),
            new PermItem(Permissions.LEAVE_APPROVE_NURSE, "Duyệt cấp 1 (Điều dưỡng trưởng)"),
            new PermItem(Permissions.LEAVE_APPROVE_HR,    "Duyệt cấp 2 (Phòng TCCB)")
        )),
        new PermGroup("Lương", List.of(
            new PermItem(Permissions.PAYROLL_VIEW,   "Xem bảng lương"),
            new PermItem(Permissions.PAYROLL_MANAGE, "Tính lương, điều chỉnh"),
            new PermItem(Permissions.PAYROLL_EXPORT, "Xuất bảng lương")
        )),
        new PermGroup("Hệ thống", List.of(
            new PermItem(Permissions.SYSTEM_ADMIN,      "Quản trị hệ thống"),
            new PermItem(Permissions.SYSTEM_PERMISSION, "Phân quyền người dùng")
        ))
    );
}
