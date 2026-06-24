package vn.hrm.personnel.adapter;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.port.DepartmentScopePort;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentScopeAdapter implements DepartmentScopePort {

    private final EmployeeRepository employeeRepository;

    @Override
    public UUID getDepartmentIdByEmail(String email) {
        return employeeRepository.findByEmail(email)
            .map(e -> e.getDepartment() != null ? e.getDepartment().getId() : null)
            .orElse(null);
    }

    @Override
    public List<UUID> getEmployeeIdsByDepartmentId(UUID departmentId) {
        return employeeRepository.findIdsByDepartmentId(departmentId);
    }
}
