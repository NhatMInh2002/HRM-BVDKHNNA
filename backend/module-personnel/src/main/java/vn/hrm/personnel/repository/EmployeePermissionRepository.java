package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hrm.personnel.domain.EmployeePermission;
import vn.hrm.personnel.domain.EmployeePermissionId;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface EmployeePermissionRepository extends JpaRepository<EmployeePermission, EmployeePermissionId> {

    @Query("SELECT p.permission FROM EmployeePermission p WHERE p.employeeId = :employeeId")
    Set<String> findPermissionsByEmployeeId(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query("DELETE FROM EmployeePermission p WHERE p.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT p.employeeId FROM EmployeePermission p WHERE p.permission = :perm")
    List<UUID> findEmployeeIdsByPermission(@Param("perm") String permission);
}
