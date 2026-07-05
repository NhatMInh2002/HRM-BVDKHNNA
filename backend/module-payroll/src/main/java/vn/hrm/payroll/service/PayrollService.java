package vn.hrm.payroll.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.domain.SalaryConfig;
import vn.hrm.payroll.domain.SalaryIncrementConfig;
import vn.hrm.payroll.domain.enums.PayrollStatus;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;
import vn.hrm.payroll.dto.*;
import vn.hrm.payroll.dto.IncrementCoefficientOptionsResponse.CoefficientOption;
import vn.hrm.payroll.dto.IncrementCoefficientOptionsResponse.RatingOption;
import vn.hrm.payroll.repository.PayrollRecordRepository;
import vn.hrm.payroll.repository.SalaryConfigRepository;
import vn.hrm.payroll.repository.SalaryIncrementConfigRepository;

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

    // ── Hằng số theo quy định hiện hành ──────────────────────────────────────

    /** Lương cơ sở từ 01/07/2026 — Nghị định (dự kiến) */
    private static final BigDecimal LUONG_CO_SO = new BigDecimal("2530000");

    /** Trần đóng BHXH/BHYT = 20 × lương cơ sở */
    private static final BigDecimal MAX_BHXH_BHYT_BASE = LUONG_CO_SO.multiply(new BigDecimal("20")); // 50,600,000

    /**
     * Trần đóng BHTN = 20 × lương tối thiểu vùng.
     * Nghệ An thuộc Vùng III — cập nhật theo Nghị định mới nhất.
     */
    private static final BigDecimal LUONG_VUNG_III   = new BigDecimal("3860000");
    private static final BigDecimal MAX_BHTN_BASE     = LUONG_VUNG_III.multiply(new BigDecimal("20")); // 77,200,000

    // Tỉ lệ BHXH/BHYT/BHTN — nhân viên
    private static final BigDecimal BHXH_EMP_RATE  = new BigDecimal("0.08");   // 8%
    private static final BigDecimal BHYT_EMP_RATE  = new BigDecimal("0.015");  // 1.5%
    private static final BigDecimal BHTN_EMP_RATE  = new BigDecimal("0.01");   // 1%

    // Tỉ lệ BHXH/BHYT/BHTN — chủ sử dụng lao động
    private static final BigDecimal BHXH_EMP_RATE_EMPLOYER   = new BigDecimal("0.175"); // 17.5%
    private static final BigDecimal BHYT_EMP_RATE_EMPLOYER   = new BigDecimal("0.03");  // 3%
    private static final BigDecimal BHTN_EMP_RATE_EMPLOYER   = new BigDecimal("0.01");  // 1%
    private static final BigDecimal BHTNLD_EMP_RATE_EMPLOYER = new BigDecimal("0.005"); // 0.5% BHTNLĐ-BNN

    /** Giảm trừ bản thân — Nghị quyết 954/2020/UBTVQH14 */
    private static final BigDecimal PERSONAL_DEDUCTION    = new BigDecimal("11000000");

    /** Giảm trừ người phụ thuộc */
    private static final BigDecimal DEPENDENT_DEDUCTION   = new BigDecimal("4400000");

    /**
     * Phụ cấp ăn ca miễn thuế TNCN — tối đa 730,000 VND/tháng.
     * Căn cứ: Công văn 1580/TCT-TNCN ngày 10/04/2024.
     */
    private static final BigDecimal FOOD_TAX_EXEMPT_LIMIT = new BigDecimal("730000");

    private final SalaryConfigRepository salaryConfigRepo;
    private final SalaryIncrementConfigRepository salaryIncrementConfigRepo;
    private final PayrollRecordRepository payrollRecordRepo;
    private final JdbcTemplate jdbc;

    // ── SalaryConfig ──────────────────────────────────────────────────────────

    @Transactional
    public SalaryConfigResponse saveSalaryConfig(SalaryConfigRequest req, String actor) {
        SalaryConfig cfg = SalaryConfig.builder()
                .employeeId(req.employeeId())
                .basicSalary(req.basicSalary())
                .coefficient(req.coefficient() != null ? req.coefficient() : BigDecimal.ONE)
                .allowanceFood(orZero(req.allowanceFood()))
                .allowanceTransport(orZero(req.allowanceTransport()))
                .allowancePhone(orZero(req.allowancePhone()))
                .allowancePosition(orZero(req.allowancePosition()))
                .allowanceSeniority(orZero(req.allowanceSeniority()))
                .allowanceHouse(orZero(req.allowanceHouse()))
                .allowanceToxic(orZero(req.allowanceToxic()))
                .allowanceOther(orZero(req.allowanceOther()))
                .dependents(req.dependents() != null ? req.dependents().shortValue() : (short) 0)
                .bhxhExempt(Boolean.TRUE.equals(req.bhxhExempt()))
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

    // ── SalaryIncrementConfig (lương tăng thêm — Điều 34/35) ────────────────────

    @Transactional
    public SalaryIncrementConfigResponse saveSalaryIncrementConfig(SalaryIncrementConfigRequest req, String actor) {
        SalaryIncrementConfig cfg = SalaryIncrementConfig.builder()
                .employeeId(req.employeeId())
                .responsibilityCoefficient(orZero(req.responsibilityCoefficient()))
                .responsibilitySecondaryCoefficient(orZero(req.responsibilitySecondaryCoefficient()))
                .qualificationCoefficient(orZero(req.qualificationCoefficient()))
                .qualificationAdjustment(req.qualificationAdjustment() != null
                        ? req.qualificationAdjustment() : QualificationAdjustment.NONE)
                .concurrentUnionCoefficient(orZero(req.concurrentUnionCoefficient()))
                .specialtyMultiplierPercent(req.specialtyMultiplierPercent() != null
                        ? req.specialtyMultiplierPercent() : new BigDecimal("100"))
                .concurrentDeptBonusPercent(orZero(req.concurrentDeptBonusPercent()))
                .concurrentDeptTimePercent(orZero(req.concurrentDeptTimePercent()))
                .ratingCode(req.ratingCode())
                .ratingPercentage(req.ratingPercentage() != null ? req.ratingPercentage() : new BigDecimal("100"))
                .workdaysActual(req.workdaysActual() != null ? req.workdaysActual() : (short) 22)
                .workdaysStandard(req.workdaysStandard() != null ? req.workdaysStandard() : (short) 22)
                .paymentMultiplier(req.paymentMultiplier() != null ? req.paymentMultiplier() : BigDecimal.ONE)
                .effectiveFrom(req.effectiveFrom())
                .createdBy(actor)
                .build();
        return SalaryIncrementConfigResponse.from(salaryIncrementConfigRepo.save(cfg));
    }

    public List<SalaryIncrementConfigResponse> getSalaryIncrementHistory(UUID employeeId) {
        return salaryIncrementConfigRepo.findByEmployeeIdOrderByEffectiveFromDesc(employeeId)
                .stream().map(SalaryIncrementConfigResponse::from).toList();
    }

    public SalaryIncrementConfigResponse getCurrentSalaryIncrement(UUID employeeId) {
        return salaryIncrementConfigRepo
                .findTopByEmployeeIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                        employeeId, LocalDate.now())
                .map(SalaryIncrementConfigResponse::from)
                .orElseThrow(() -> new IllegalStateException("Chưa cấu hình lương tăng thêm cho nhân viên này"));
    }

    public IncrementCoefficientOptionsResponse getIncrementCoefficientOptions() {
        List<CoefficientOption> responsibility = jdbc.query(
                "SELECT id, position_name, coefficient FROM payroll.responsibility_coefficients ORDER BY display_order",
                (rs, i) -> new CoefficientOption(rs.getInt("id"), rs.getString("position_name"), rs.getBigDecimal("coefficient")));

        List<CoefficientOption> qualification = jdbc.query(
                "SELECT id, qualification_name, coefficient FROM payroll.qualification_coefficients ORDER BY display_order",
                (rs, i) -> new CoefficientOption(rs.getInt("id"), rs.getString("qualification_name"), rs.getBigDecimal("coefficient")));

        List<CoefficientOption> concurrentUnion = jdbc.query(
                "SELECT id, role_name, coefficient FROM payroll.concurrent_role_coefficients ORDER BY display_order",
                (rs, i) -> new CoefficientOption(rs.getInt("id"), rs.getString("role_name"), rs.getBigDecimal("coefficient")));

        List<RatingOption> ratings = jdbc.query(
                "SELECT rating_code, rating_name, percentage FROM payroll.merit_rating_scale ORDER BY display_order",
                (rs, i) -> new RatingOption(rs.getString("rating_code"), rs.getString("rating_name"), rs.getBigDecimal("percentage")));

        return new IncrementCoefficientOptionsResponse(responsibility, qualification, concurrentUnion, ratings);
    }

    // ── Generate payroll ──────────────────────────────────────────────────────

    @Transactional
    public int generatePeriod(int year, int month, String actor) {
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
        YearMonth ym = YearMonth.of(year, month);
        short workingDays = (short) countWorkdays(ym);
        short actualDays  = getActualDays(empId, year, month, workingDays);
        BigDecimal otHours = getOtHours(empId, year, month);

        // ── 1. Lương cơ bản theo ngày thực tế ────────────────────────────────
        BigDecimal coeff    = orZero(cfg.getCoefficient()).compareTo(BigDecimal.ZERO) > 0
                              ? cfg.getCoefficient() : BigDecimal.ONE;
        BigDecimal baseFull = cfg.getBasicSalary().multiply(coeff);
        BigDecimal basicPro = workingDays > 0
                ? baseFull.multiply(BigDecimal.valueOf(actualDays))
                          .divide(BigDecimal.valueOf(workingDays), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── 2. Phụ cấp miễn thuế & BHXH ─────────────────────────────────────
        BigDecimal toxic    = orZero(cfg.getAllowanceToxic());    // hoàn toàn miễn thuế + BHXH
        BigDecimal food     = orZero(cfg.getAllowanceFood());
        BigDecimal foodExempt  = food.min(FOOD_TAX_EXEMPT_LIMIT); // miễn thuế ≤730K
        BigDecimal foodTaxable = food.subtract(foodExempt).max(BigDecimal.ZERO);
        BigDecimal taxExemptAllowance = toxic.add(foodExempt);

        // ── 3. Phụ cấp chịu thuế ─────────────────────────────────────────────
        BigDecimal taxableAllowance = foodTaxable
                .add(orZero(cfg.getAllowanceTransport()))
                .add(orZero(cfg.getAllowancePhone()))
                .add(orZero(cfg.getAllowancePosition()))
                .add(orZero(cfg.getAllowanceSeniority()))
                .add(orZero(cfg.getAllowanceHouse()))
                .add(orZero(cfg.getAllowanceOther()));

        // ── 4. OT: 150% lương giờ ngày thường ───────────────────────────────
        BigDecimal hourlyRate = workingDays > 0
                ? baseFull.divide(BigDecimal.valueOf(workingDays * 8L), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal otPay = hourlyRate.multiply(new BigDecimal("1.5")).multiply(otHours)
                .setScale(0, RoundingMode.HALF_UP);

        // ── 5. Gross ──────────────────────────────────────────────────────────
        BigDecimal gross = basicPro.add(taxableAllowance).add(taxExemptAllowance).add(otPay);
        // (bonus = 0 khi generate hàng loạt, HR sẽ điều chỉnh thủ công nếu cần)

        // ── 6. BHXH / BHYT / BHTN nhân viên ─────────────────────────────────
        boolean bhxhExempt = Boolean.TRUE.equals(cfg.getBhxhExempt());

        // Mức đóng BHXH/BHYT: tính trên basicPro (không gồm phụ cấp, không gồm toxic)
        BigDecimal bhxhBase = bhxhExempt ? BigDecimal.ZERO
                : basicPro.min(MAX_BHXH_BHYT_BASE);
        BigDecimal bhxh = bhxhBase.multiply(BHXH_EMP_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhyt = bhxhBase.multiply(BHYT_EMP_RATE).setScale(0, RoundingMode.HALF_UP);

        // Mức đóng BHTN: tính trên basicPro, trần riêng (20 × lương vùng tối thiểu)
        BigDecimal bhtnBase = bhxhExempt ? BigDecimal.ZERO
                : basicPro.min(MAX_BHTN_BASE);
        BigDecimal bhtn = bhtnBase.multiply(BHTN_EMP_RATE).setScale(0, RoundingMode.HALF_UP);

        // ── 7. Thuế TNCN ─────────────────────────────────────────────────────
        // Thu nhập chịu thuế = (gross - taxExemptAllowance) - BHXH - BHYT - BHTN - personal - dependent
        BigDecimal taxableBase = gross.subtract(taxExemptAllowance).subtract(bhxh).subtract(bhyt).subtract(bhtn);
        BigDecimal personalDed  = PERSONAL_DEDUCTION;
        short dependents        = cfg.getDependents() != null ? cfg.getDependents() : 0;
        BigDecimal dependentDed = DEPENDENT_DEDUCTION.multiply(BigDecimal.valueOf(dependents));
        BigDecimal taxableIncome = taxableBase.subtract(personalDed).subtract(dependentDed)
                .max(BigDecimal.ZERO);
        BigDecimal pit = calcPit(taxableIncome);

        // ── 8. Tổng khấu trừ & lương thực nhận ──────────────────────────────
        BigDecimal totalDeduction = bhxh.add(bhyt).add(bhtn).add(pit);
        BigDecimal net = gross.subtract(totalDeduction);

        // ── 9. Chi phí chủ sử dụng ───────────────────────────────────────────
        BigDecimal bhxhEmp   = bhxhExempt ? BigDecimal.ZERO
                : bhxhBase.multiply(BHXH_EMP_RATE_EMPLOYER).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhytEmp   = bhxhExempt ? BigDecimal.ZERO
                : bhxhBase.multiply(BHYT_EMP_RATE_EMPLOYER).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhtnEmp   = bhxhExempt ? BigDecimal.ZERO
                : bhtnBase.multiply(BHTN_EMP_RATE_EMPLOYER).setScale(0, RoundingMode.HALF_UP);
        BigDecimal bhtnldEmp = bhxhExempt ? BigDecimal.ZERO
                : bhxhBase.multiply(BHTNLD_EMP_RATE_EMPLOYER).setScale(0, RoundingMode.HALF_UP);
        BigDecimal totalEmployerCost = gross.add(bhxhEmp).add(bhytEmp).add(bhtnEmp).add(bhtnldEmp);

        return PayrollRecord.builder()
                .employeeId(empId)
                .periodYear((short) year)
                .periodMonth((short) month)
                .basicSalary(basicPro)
                .totalAllowance(taxableAllowance)
                .taxExemptAllowance(taxExemptAllowance)
                .bonus(BigDecimal.ZERO)
                .otPay(otPay)
                .grossSalary(gross)
                .bhxhEmployee(bhxh)
                .bhytEmployee(bhyt)
                .bhtnEmployee(bhtn)
                .personalDeduction(personalDed)
                .dependentDeduction(dependentDed)
                .taxableIncome(taxableIncome)
                .pit(pit)
                .otherDeduction(BigDecimal.ZERO)
                .totalDeduction(totalDeduction)
                .netSalary(net)
                .bhxhEmployer(bhxhEmp)
                .bhytEmployer(bhytEmp)
                .bhtnEmployer(bhtnEmp)
                .bhtnldEmployer(bhtnldEmp)
                .totalEmployerCost(totalEmployerCost)
                .workingDays(workingDays)
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
                .map(r -> {
                    try {
                        Map<String, Object> emp = jdbc.queryForMap(
                            "SELECT employee_code, full_name, d.name as dept_name " +
                            "FROM personnel.employees e LEFT JOIN personnel.departments d ON d.id = e.department_id " +
                            "WHERE e.id = ?", r.getEmployeeId());
                        return PayrollRecordResponse.from(r,
                            str(emp.get("employee_code")),
                            str(emp.get("full_name")),
                            str(emp.get("dept_name")));
                    } catch (Exception ex) {
                        return PayrollRecordResponse.from(r, null, null, null);
                    }
                });
    }

    public List<PayrollRecordResponse> myPayroll(UUID employeeId) {
        return payrollRecordRepo.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(employeeId)
                .stream().map(PayrollRecordResponse::from).toList();
    }

    private static String str(Object v) { return v != null ? v.toString() : ""; }

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
            return days != null && days > 0 ? days.shortValue() : workingDays;
        } catch (Exception e) {
            return workingDays;
        }
    }

    private BigDecimal getOtHours(UUID empId, int year, int month) {
        try {
            BigDecimal hours = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (check_out - check_in))/3600 - 8), 0) " +
                    "FROM attendance.attendance_records " +
                    "WHERE employee_id = ? AND EXTRACT(YEAR FROM work_date) = ? " +
                    "AND EXTRACT(MONTH FROM work_date) = ? AND check_out IS NOT NULL " +
                    "AND (EXTRACT(EPOCH FROM (check_out - check_in))/3600) > 8",
                    BigDecimal.class, empId, year, month);
            return hours != null ? hours.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)
                                 : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * Thuế TNCN lũy tiến 7 bậc theo Điều 22 Luật Thuế TNCN.
     * Áp dụng cho thu nhập chịu thuế hàng tháng.
     *
     * Bậc | Thu nhập chịu thuế/tháng     | Thuế suất
     *  1  | ≤ 5,000,000                  |  5%
     *  2  | 5,000,001 – 10,000,000       | 10%
     *  3  | 10,000,001 – 18,000,000      | 15%
     *  4  | 18,000,001 – 32,000,000      | 20%
     *  5  | 32,000,001 – 52,000,000      | 25%
     *  6  | 52,000,001 – 80,000,000      | 30%
     *  7  | > 80,000,000                 | 35%
     */
    private BigDecimal calcPit(BigDecimal taxableIncome) {
        if (taxableIncome.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        long income = taxableIncome.longValue();
        long[] lowerBounds = {0, 5_000_000, 10_000_000, 18_000_000, 32_000_000, 52_000_000, 80_000_000};
        long[] upperBounds = {5_000_000, 10_000_000, 18_000_000, 32_000_000, 52_000_000, 80_000_000, Long.MAX_VALUE};
        int[]  rates       = {5, 10, 15, 20, 25, 30, 35};

        BigDecimal tax = BigDecimal.ZERO;
        for (int i = 0; i < rates.length; i++) {
            if (income <= lowerBounds[i]) break;
            long upper = upperBounds[i] == Long.MAX_VALUE ? income : Math.min(income, upperBounds[i]);
            long slice = upper - lowerBounds[i];
            tax = tax.add(BigDecimal.valueOf(slice * rates[i] / 100));
        }
        return tax.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
