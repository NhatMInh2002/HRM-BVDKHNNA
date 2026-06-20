package vn.hrm.personnel.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.EmployeeStatus;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    long countByStatus(EmployeeStatus status);

    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByEmail(String email);

    // keyword luôn là non-null (service default "" khi null) để tránh lower(bytea) error
    @Query("""
        SELECT e FROM Employee e
        LEFT JOIN FETCH e.department d
        WHERE (LOWER(e.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(e.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR d.id = :departmentId)
    """)
    Page<Employee> search(
        @Param("keyword") String keyword,
        @Param("status") EmployeeStatus status,
        @Param("departmentId") UUID departmentId,
        Pageable pageable
    );
}
