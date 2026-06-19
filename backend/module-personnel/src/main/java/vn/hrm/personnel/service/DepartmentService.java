package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Department;
import vn.hrm.personnel.dto.DepartmentResponse;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.shared.exception.HrmException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

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
}
