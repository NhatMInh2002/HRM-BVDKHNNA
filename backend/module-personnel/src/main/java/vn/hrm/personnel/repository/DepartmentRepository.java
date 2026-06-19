package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.hrm.personnel.domain.Department;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(String code);

    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.children WHERE d.parent IS NULL")
    List<Department> findRoots();
}
