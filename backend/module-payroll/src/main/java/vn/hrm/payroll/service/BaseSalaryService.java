package vn.hrm.payroll.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.hrm.payroll.domain.BaseSalaryConfig;
import vn.hrm.payroll.repository.BaseSalaryConfigRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tra cứu lương cơ sở theo ngày hiệu lực từ payroll.base_salary_configs.
 * Fallback về mức 2.530.000 (01/07/2026) nếu bảng trống — chỉ xảy ra
 * khi DB chưa chạy migration V37.
 */
@Service
@RequiredArgsConstructor
public class BaseSalaryService {

    static final BigDecimal FALLBACK = new BigDecimal("2530000");

    private final BaseSalaryConfigRepository repo;

    public BigDecimal getBaseSalary(LocalDate date) {
        return repo.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
                .map(BaseSalaryConfig::getAmount)
                .orElse(FALLBACK);
    }

    public BigDecimal getCurrentBaseSalary() {
        return getBaseSalary(LocalDate.now());
    }
}
