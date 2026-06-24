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
        return employeeRepository.findAllActive(PageRequest.of(page, size))
                .stream()
                .filter(e -> keyword == null || keyword.isBlank()
                        || e.getFullName().toLowerCase().contains(keyword.toLowerCase())
                        || e.getEmployeeCode().toLowerCase().contains(keyword.toLowerCase()))
                .map(this::toView)
                .toList();
    }

    @Override
    public long countAll(String keyword) {
        return employeeRepository.count();
    }

    @Override
    @Transactional
    public void updateRole(UUID employeeId, String role, String keycloakUsername) {
        employeeRepository.findById(employeeId).ifPresent(e -> {
            e.setHrmRole(role);
            if (keycloakUsername != null && !keycloakUsername.isBlank()) {
                e.setKeycloakUsername(keycloakUsername);
            }
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
                e.getKeycloakUsername(),
                e.getHrmRole(),
                e.getStatus() != null ? e.getStatus().name() : null
        );
    }
}
