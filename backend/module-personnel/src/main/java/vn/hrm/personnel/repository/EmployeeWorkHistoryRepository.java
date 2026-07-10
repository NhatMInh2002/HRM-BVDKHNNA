package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeWorkHistory;

import java.util.List;
import java.util.UUID;

public interface EmployeeWorkHistoryRepository extends JpaRepository<EmployeeWorkHistory, UUID> {
    List<EmployeeWorkHistory> findByEmployeeIdOrderByDisplayOrderAscFromDateAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
