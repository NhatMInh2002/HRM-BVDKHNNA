package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Department;
import vn.hrm.personnel.dto.DepartmentResponse;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.exception.HrmException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    /** Tất cả phòng ban phẳng — dùng cho dropdown */
    @Transactional(readOnly = true)
    public List<DepartmentResponse> findAll() {
        return departmentRepository.findAll().stream()
                .map(DepartmentResponse::flat)
                .toList();
    }

    /** Cây phân cấp — chỉ lấy root (parent_id IS NULL) và children */
    @Transactional(readOnly = true)
    public List<DepartmentResponse> findTree() {
        return departmentRepository.findRoots().stream()
                .map(DepartmentResponse::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse findById(UUID id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> HrmException.notFound("DEPT_NOT_FOUND", "Không tìm thấy phòng ban: " + id));
        return DepartmentResponse.of(dept);
    }

    /** Cập nhật thông tin liên hệ: người đứng đầu + SĐT liên hệ + SĐT trực. */
    @Transactional
    public DepartmentResponse updateContact(UUID id, UUID managerId, String contactPhone, String dutyPhone) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> HrmException.notFound("DEPT_NOT_FOUND", "Không tìm thấy phòng ban: " + id));

        if (managerId != null) {
            dept.setManager(employeeRepository.findById(managerId)
                    .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + managerId)));
        } else {
            dept.setManager(null);
        }
        dept.setContactPhone(blankToNull(contactPhone));
        dept.setDutyPhone(blankToNull(dutyPhone));

        return DepartmentResponse.of(departmentRepository.save(dept));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
