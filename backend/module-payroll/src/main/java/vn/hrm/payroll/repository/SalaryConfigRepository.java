package vn.hrm.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.payroll.domain.SalaryConfig;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SalaryConfigRepository extends JpaRepository<SalaryConfig, UUID> {

    Optional<SalaryConfig> findTopByEmployeeIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            UUID employeeId, LocalDate date);

    java.util.List<SalaryConfig> findByEmployeeIdOrderByEffectiveFromDesc(UUID employeeId);
}
