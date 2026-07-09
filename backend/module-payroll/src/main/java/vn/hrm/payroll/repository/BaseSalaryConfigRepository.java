package vn.hrm.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.payroll.domain.BaseSalaryConfig;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BaseSalaryConfigRepository extends JpaRepository<BaseSalaryConfig, Integer> {

    Optional<BaseSalaryConfig> findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(LocalDate date);

    List<BaseSalaryConfig> findAllByOrderByEffectiveFromDesc();
}
