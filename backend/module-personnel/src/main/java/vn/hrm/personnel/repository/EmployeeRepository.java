package vn.hrm.personnel.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.EmployeeStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmail(String email);

    long countByStatus(EmployeeStatus status);

    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByEmail(String email);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department ORDER BY e.fullName")
    Page<Employee> findAllActive(Pageable pageable);

    @Query("SELECT e.id FROM Employee e WHERE e.department.id = :departmentId")
    List<UUID> findIdsByDepartmentId(@Param("departmentId") UUID departmentId);

    // unaccent() để tìm kiếm không phân biệt dấu tiếng Việt (VD: "Nhat Minh" = "Nhật Minh")
    @Query(value = """
        SELECT e.* FROM personnel.employees e
        LEFT JOIN personnel.departments d ON e.department_id = d.id
        WHERE (
            unaccent(lower(e.full_name))    LIKE unaccent(lower(concat('%', :keyword, '%')))
            OR lower(e.employee_code)       LIKE lower(concat('%', :keyword, '%'))
            OR lower(e.email)               LIKE lower(concat('%', :keyword, '%'))
        )
        AND (:status IS NULL OR e.status = CAST(:status AS VARCHAR))
        AND (:departmentId IS NULL OR e.department_id = CAST(:departmentId AS UUID))
        ORDER BY e.full_name
    """,
    countQuery = """
        SELECT COUNT(*) FROM personnel.employees e
        WHERE (
            unaccent(lower(e.full_name))    LIKE unaccent(lower(concat('%', :keyword, '%')))
            OR lower(e.employee_code)       LIKE lower(concat('%', :keyword, '%'))
            OR lower(e.email)               LIKE lower(concat('%', :keyword, '%'))
        )
        AND (:status IS NULL OR e.status = CAST(:status AS VARCHAR))
        AND (:departmentId IS NULL OR e.department_id = CAST(:departmentId AS UUID))
    """,
    nativeQuery = true)
    Page<Employee> search(
        @Param("keyword") String keyword,
        @Param("status") String status,
        @Param("departmentId") UUID departmentId,
        Pageable pageable
    );
}
