package vn.hrm.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.payroll.domain.SpecialtyDepartmentMultiplier;

import java.util.Optional;
import java.util.UUID;

public interface SpecialtyDepartmentMultiplierRepository
        extends JpaRepository<SpecialtyDepartmentMultiplier, Integer> {

    Optional<SpecialtyDepartmentMultiplier> findByDepartmentId(UUID departmentId);
}
