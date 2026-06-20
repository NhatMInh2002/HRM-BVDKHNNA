package vn.hrm.payroll.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.domain.enums.PayrollStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, UUID> {

    Optional<PayrollRecord> findByEmployeeIdAndPeriodYearAndPeriodMonth(
            UUID employeeId, short year, short month);

    Page<PayrollRecord> findByPeriodYearAndPeriodMonth(short year, short month, Pageable pageable);

    Page<PayrollRecord> findByPeriodYearAndPeriodMonthAndStatus(
            short year, short month, PayrollStatus status, Pageable pageable);

    List<PayrollRecord> findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(UUID employeeId);
}
