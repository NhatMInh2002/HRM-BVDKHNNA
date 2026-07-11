package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeFamilyRelation;

import java.util.List;
import java.util.UUID;

public interface EmployeeFamilyRelationRepository extends JpaRepository<EmployeeFamilyRelation, UUID> {
    List<EmployeeFamilyRelation> findByEmployeeIdOrderBySideAscDisplayOrderAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
