package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeTraining;

import java.util.List;
import java.util.UUID;

public interface EmployeeTrainingRepository extends JpaRepository<EmployeeTraining, UUID> {
    List<EmployeeTraining> findByEmployeeIdOrderByDisplayOrderAscFromDateAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
