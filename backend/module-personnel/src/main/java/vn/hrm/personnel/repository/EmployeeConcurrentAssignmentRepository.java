package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeConcurrentAssignment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeConcurrentAssignmentRepository extends JpaRepository<EmployeeConcurrentAssignment, UUID> {

    List<EmployeeConcurrentAssignment> findByEmployeeIdOrderByEffectiveFromDesc(UUID employeeId);

    Optional<EmployeeConcurrentAssignment> findFirstByEmployeeIdAndEffectiveToIsNullOrderByEffectiveFromDesc(UUID employeeId);
}
