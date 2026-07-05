package vn.hrm.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.payroll.domain.SalaryIncrementConfig;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalaryIncrementConfigRepository extends JpaRepository<SalaryIncrementConfig, UUID> {

    Optional<SalaryIncrementConfig> findTopByEmployeeIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            UUID employeeId, LocalDate date);

    List<SalaryIncrementConfig> findByEmployeeIdOrderByEffectiveFromDesc(UUID employeeId);
}
