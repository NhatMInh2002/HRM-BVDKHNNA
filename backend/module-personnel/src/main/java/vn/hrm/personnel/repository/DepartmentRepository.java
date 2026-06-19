package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.Department;

import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(String code);
}
