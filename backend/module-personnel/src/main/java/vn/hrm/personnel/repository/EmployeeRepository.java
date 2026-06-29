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

    List<Employee> findByHrmRoleIn(List<String> roles);

    /** Tìm trưởng phòng của một khoa/phòng cụ thể */
    @Query("SELECT e FROM Employee e WHERE e.department.id = :deptId AND e.hrmRole = 'DEPT_HEAD'")
    List<Employee> findDeptHeadByDepartmentId(@Param("deptId") UUID deptId);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department ORDER BY e.fullName")
    Page<Employee> findAllActive(Pageable pageable);

    @Query("SELECT e.id FROM Employee e WHERE e.department.id = :departmentId")
    List<UUID> findIdsByDepartmentId(@Param("departmentId") UUID departmentId);

    @Query("""
        SELECT e FROM Employee e
        LEFT JOIN FETCH e.department d
        WHERE (:keyword = '' OR
            LOWER(e.fullName)        LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(e.email)        LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR e.phone               LIKE CONCAT('%', :keyword, '%')
        )
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR d.id = :departmentId)
        ORDER BY e.fullName
    """)
    Page<Employee> search(
        @Param("keyword") String keyword,
        @Param("status") EmployeeStatus status,
        @Param("departmentId") UUID departmentId,
        Pageable pageable
    );
}
