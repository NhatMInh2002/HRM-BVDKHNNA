package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeAward;

import java.util.List;
import java.util.UUID;

public interface EmployeeAwardRepository extends JpaRepository<EmployeeAward, UUID> {
    List<EmployeeAward> findByEmployeeIdOrderByTypeAscDisplayOrderAscYearAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
