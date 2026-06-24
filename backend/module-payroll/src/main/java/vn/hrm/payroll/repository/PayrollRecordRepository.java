package vn.hrm.payroll.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.domain.enums.PayrollStatus;

import java.math.BigDecimal;
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

    @Query("""
        SELECT p.periodYear AS yr, p.periodMonth AS mo,
               SUM(p.netSalary) AS totalNet, SUM(p.grossSalary) AS totalGross, COUNT(p) AS cnt
        FROM PayrollRecord p
        WHERE p.status IN ('APPROVED', 'PAID')
          AND (p.periodYear * 100 + p.periodMonth) >= :fromPeriod
        GROUP BY p.periodYear, p.periodMonth
        ORDER BY p.periodYear, p.periodMonth
    """)
    List<Object[]> monthlyTrend(@Param("fromPeriod") int fromPeriod);
}
