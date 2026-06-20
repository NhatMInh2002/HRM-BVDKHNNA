package vn.hrm.payroll.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.domain.SalaryConfig;
import vn.hrm.payroll.domain.enums.PayrollStatus;
import vn.hrm.payroll.dto.*;
import vn.hrm.payroll.repository.PayrollRecordRepository;
import vn.hrm.payroll.repository.SalaryConfigRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private static final BigDecimal BHXH_RATE  = new BigDecimal("0.08");
    private static final BigDecimal BHYT_RATE  = new BigDecimal("0.015");
    private static final BigDecimal BHTN_RATE  = new BigDecimal("0.01");
    // Mức đóng BHXH tối đa = 20 x lương cơ sở (2,340,000 VND/tháng, hiệu lực 2024)
    private static final BigDecimal LUONG_CO_SO = new BigDecimal("2340000");
    private static final BigDecimal MAX_BHXH_BASE = LUONG_CO_SO.multiply(new BigDecimal("20"));

    private final SalaryConfigRepository salaryConfigRepo;
    private final PayrollRecordRepository payrollRecordRepo;
    private final JdbcTemplate jdbc;

    // ── SalaryConfig ──────────────────────────────────────────────────────────

    @Transactional
    public SalaryConfigResponse saveSalaryConfig(SalaryConfigRequest req, String actor) {
        SalaryConfig cfg = SalaryConfig.builder()
                .employeeId(req.employeeId())
                .basicSalary(req.basicSalary())
                .allowanceFood(orZero(req.allowanceFood()))
                .allowanceTransport(orZero(req.allowanceTransport()))
                .allowancePhone(orZero(req.allowancePhone()))
                .allowanceOther(orZero(req.allowanceOther()))
                .coefficient(req.coefficient() != null ? req.coefficient() : BigDecimal.ONE)
                .effectiveFrom(req.effectiveFrom())
                .createdBy(actor)
                .build();
        return SalaryConfigResponse.from(salaryConfigRepo.save(cfg));
    }

    public List<SalaryConfigResponse> getSalaryHistory(UUID employeeId) {
        return salaryConfigRepo.findByEmployeeIdOrderByEffectiveFromDesc(employeeId)
                .stream().map(SalaryConfigResponse::from).toList();
    }

    public SalaryConfigResponse getCurrentSalary(UUID employeeId) {
        return salaryConfigRepo
                .findTopByEmployeeIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                        employeeId, LocalDate.now())
                .map(SalaryConfigResponse::from)
                .orElseThrow(() -> new IllegalStateException("Chưa cấu hình lương cho nhân viên này"));
    }

    // ── Generate payroll ──────────────────────────────────────────────────────

    @Transactional
    public int generatePeriod(int year, int month, String actor) {
        // Lấy danh sách nhân viên đang ACTIVE / PROBATION
        List<Map<String, Object>> employees = jdbc.queryForList(
                "SELECT id FROM personnel.employees WHERE status IN ('ACTIVE','PROBATION')");

        int[] count = {0};
        for (Map<String, Object> row : employees) {
            UUID empId = (UUID) row.get("id");
            if (payrollRecordRepo.findByEmployeeIdAndPeriodYearAndPeriodMonth(
                    empId, (short) year, (short) month).isPresent()) continue;

            salaryConfigRepo.findTopByEmployeeIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                    empId, LocalDate.of(year, month, 1)).ifPresent(cfg -> {
                PayrollRecord rec = calculate(empId, year, month, cfg, actor);
                payrollRecordRepo.save(rec);
                count[0]++;
            });
        }
        return count[0];
    }

    private PayrollRecord calculate(UUID empId, int year, int month,
                                    SalaryConfig cfg, String actor) {
        // Số ngày làm việc chuẩn trong tháng (Monday–Friday)
        YearMonth ym = YearMonth.of(year, month);
        short workingDays = (short) countWorkdays(ym);

        // Lấy ngày thực tế từ attendance (nếu không có → tính đủ)
        short actualDays = getActualDays(empId, year, month, workingDays);
        BigDecimal otHours = getOtHours(empId, year, month);

        // Tính lương cơ bản theo ngày thực tế
        BigDecimal baseFull = cfg.getBasicSalary().multiply(cfg.getCoefficient());
        BigDecimal basicPro = workingDays > 0
                ? baseFull.multiply(BigDecimal.valueOf(actualDays))
                          .divide(BigDecimal.valueOf(workingDays), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Phụ cấp (không tính theo ngày)
        BigDecimal allowance = orZero(cfg.getAllowanceFood())
                .add(orZero(cfg.getAllowanceTransport()))
                .add(orZero(cfg.getAllowancePhone()))
                .add(orZero(cfg.getAllowanceOther()));

        // OT: 150% lương giờ ngày thường
        BigDecimal hourlyRate = baseFull.divide(BigDecimal.valueOf(workingDays * 8L), 2, RoundingMode.HALF_UP);
        BigDecimal otPay = hourlyRate.multiply(new BigDecimal("1.5")).multiply(otHours)
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal gross = basicPro.add(allowance).add(otPay);

        // BHXH/BHYT/BHTN tính trên basicPro, tối đa MAX_BHXH_BASE
        BigDecimal bhxhBase = basicPro.min(MAX_BHXH_BASE);
        BigDecimal bhxh  = bhxhBase.multiply(BHXH_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhyt  = bhxhBase.multiply(BHYT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhtn  = bhxhBase.multiply(BHTN_RATE).setScale(0, RoundingMode.HALF_UP);

        // Thuế TNCN (lũy tiến 7 bậc, giảm trừ bản thân 11tr/tháng)
        BigDecimal taxableIncome = gross.subtract(bhxh).subtract(bhyt).subtract(bhtn)
                .subtract(new BigDecimal("11000000"))  // giảm trừ bản thân
                .max(BigDecimal.ZERO);
        BigDecimal pit = calcPit(taxableIncome);

        BigDecimal totalDeduction = bhxh.add(bhyt).add(bhtn).add(pit);
        BigDecimal net = gross.subtract(totalDeduction);

        return PayrollRecord.builder()
                .employeeId(empId)
                .periodYear((short) year)
                .periodMonth((short) month)
                .basicSalary(basicPro)
                .totalAllowance(allowance)
                .otPay(otPay)
                .grossSalary(gross)
                .bhxhEmployee(bhxh)
                .bhytEmployee(bhyt)
                .bhtnEmployee(bhtn)
                .pit(pit)
                .otherDeduction(BigDecimal.ZERO)
                .totalDeduction(totalDeduction)
                .netSalary(net)
                .workingDays((short) workingDays)
                .actualDays(actualDays)
                .otHours(otHours)
                .status(PayrollStatus.DRAFT)
                .createdBy(actor)
                .build();
    }

    // ── Approve / Pay ─────────────────────────────────────────────────────────

    @Transactional
    public PayrollRecordResponse approve(UUID id, String actor) {
        PayrollRecord rec = payrollRecordRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi lương"));
        if (rec.getStatus() != PayrollStatus.DRAFT)
            throw new IllegalStateException("Chỉ duyệt bản ghi ở trạng thái DRAFT");
        rec.setStatus(PayrollStatus.APPROVED);
        rec.setApprovedBy(actor);
        rec.setApprovedAt(LocalDateTime.now());
        return PayrollRecordResponse.from(payrollRecordRepo.save(rec));
    }

    @Transactional
    public PayrollRecordResponse markPaid(UUID id, String actor) {
        PayrollRecord rec = payrollRecordRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi lương"));
        if (rec.getStatus() != PayrollStatus.APPROVED)
            throw new IllegalStateException("Chỉ đánh dấu đã trả khi đã APPROVED");
        rec.setStatus(PayrollStatus.PAID);
        return PayrollRecordResponse.from(payrollRecordRepo.save(rec));
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    public Page<PayrollRecordResponse> listByPeriod(int year, int month, Pageable pageable) {
        return payrollRecordRepo.findByPeriodYearAndPeriodMonth((short) year, (short) month, pageable)
                .map(PayrollRecordResponse::from);
    }

    public List<PayrollRecordResponse> myPayroll(UUID employeeId) {
        return payrollRecordRepo.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(employeeId)
                .stream().map(PayrollRecordResponse::from).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int countWorkdays(YearMonth ym) {
        int count = 0;
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            var dow = ym.atDay(d).getDayOfWeek();
            if (dow != java.time.DayOfWeek.SATURDAY && dow != java.time.DayOfWeek.SUNDAY) count++;
        }
        return count;
    }

    private short getActualDays(UUID empId, int year, int month, short workingDays) {
        try {
            Integer days = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM attendance.attendance_records " +
                    "WHERE employee_id = ? AND EXTRACT(YEAR FROM work_date) = ? " +
                    "AND EXTRACT(MONTH FROM work_date) = ? AND status IN ('PRESENT','LATE')",
                    Integer.class, empId, year, month);
            return days != null ? days.shortValue() : workingDays;
        } catch (Exception e) {
            return workingDays;
        }
    }

    private BigDecimal getOtHours(UUID empId, int year, int month) {
        try {
            BigDecimal hours = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) - 8, 0) " +
                    "FROM attendance.attendance_records " +
                    "WHERE employee_id = ? AND EXTRACT(YEAR FROM work_date) = ? " +
                    "AND EXTRACT(MONTH FROM work_date) = ? AND check_out_time IS NOT NULL " +
                    "AND (EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) > 8",
                    BigDecimal.class, empId, year, month);
            return hours != null ? hours.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)
                                 : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    // Thuế TNCN lũy tiến 7 bậc (Điều 22 Luật thuế TNCN)
    private BigDecimal calcPit(BigDecimal taxableIncome) {
        if (taxableIncome.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        // Bậc thuế theo tháng (triệu VND)
        long[][] brackets = {
            {  5_000_000,  5},
            { 10_000_000, 10},
            { 18_000_000, 15},
            { 32_000_000, 20},
            { 52_000_000, 25},
            { 80_000_000, 30},
            {Long.MAX_VALUE, 35}
        };
        long[] thresholds = {0, 5_000_000, 10_000_000, 18_000_000, 32_000_000, 52_000_000, 80_000_000};
        BigDecimal tax = BigDecimal.ZERO;
        long income = taxableIncome.longValue();
        for (int i = 0; i < brackets.length; i++) {
            long lower = thresholds[i];
            long upper = brackets[i][0];
            if (income <= lower) break;
            long slice = Math.min(income, upper) - lower;
            tax = tax.add(BigDecimal.valueOf(slice * brackets[i][1] / 100));
        }
        return tax.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
