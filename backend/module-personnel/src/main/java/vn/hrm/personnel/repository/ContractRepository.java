package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.hrm.personnel.domain.Contract;
import vn.hrm.personnel.domain.enums.ContractStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    List<Contract> findByStatusOrderByEndDateAsc(ContractStatus status);

    /** Hợp đồng sắp hết hạn trong N ngày tới */
    @Query("SELECT c FROM Contract c WHERE c.status = 'ACTIVE' AND c.endDate IS NOT NULL AND c.endDate BETWEEN :from AND :to ORDER BY c.endDate ASC")
    List<Contract> findExpiringBetween(LocalDate from, LocalDate to);

    boolean existsByContractNumber(String contractNumber);
}
