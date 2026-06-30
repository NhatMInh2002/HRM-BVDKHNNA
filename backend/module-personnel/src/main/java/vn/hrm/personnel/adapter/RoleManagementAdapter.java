package vn.hrm.personnel.adapter;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.port.RoleManagementPort;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RoleManagementAdapter implements RoleManagementPort {

    private final EmployeeRepository employeeRepository;

    @Override
    public List<EmployeeRoleView> findAllForRoleManagement(String keyword, int page, int size) {
        String kw = keyword == null ? "" : keyword.trim();
        return employeeRepository
                .search(kw, null, null, PageRequest.of(page, size))
                .stream()
                .map(this::toView)
                .toList();
    }

    @Override
    public long countAll(String keyword) {
        String kw = keyword == null ? "" : keyword.trim();
        return employeeRepository.search(kw, null, null, PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
    }

    @Override
    @Transactional
    public void updateRole(UUID employeeId, String role) {
        employeeRepository.findById(employeeId).ifPresent(e -> {
            e.setHrmRole(role);
            employeeRepository.save(e);
        });
    }

    private EmployeeRoleView toView(Employee e) {
        return new EmployeeRoleView(
                e.getId(),
                e.getEmployeeCode(),
                e.getFullName(),
                e.getEmail(),
                e.getDepartment() != null ? e.getDepartment().getName() : null,
                e.getPosition(),
                e.getHrmRole(),
                e.getStatus() != null ? e.getStatus().name() : null
        );
    }
}
