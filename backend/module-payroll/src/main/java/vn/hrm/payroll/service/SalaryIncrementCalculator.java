package vn.hrm.payroll.service;

import vn.hrm.payroll.domain.SalaryIncrementConfig;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Tính thu nhập tăng thêm (TNTT) theo Điều 34/35 quy chế chi tiêu nội bộ:
 *
 * <pre>
 * TNTT = lương cơ sở × tổng hệ số × %xếp loại × (ngày công thực tế / chuẩn) × số lần chi trả
 * Tổng hệ số = HS trách nhiệm (chính + 25% phụ)
 *            + HS trình độ điều chỉnh (× CCHN/liên thông × %đặc thù khoa/phòng)
 *            + HS kiêm nhiệm đoàn thể
 *            + HS kiêm nhiệm khoa/phòng (= HS trình độ điều chỉnh × %phụ trội × %thời gian)
 * </pre>
 *
 * Dùng chung cho preview cấu hình ({@code SalaryIncrementConfigResponse})
 * và sinh bảng lương ({@code PayrollService.generatePeriod}).
 */
public final class SalaryIncrementCalculator {

    private SalaryIncrementCalculator() {}

    public record Result(
            BigDecimal responsibilityTotal,
            BigDecimal qualificationAdjusted,
            BigDecimal concurrentDeptCoefficient,
            BigDecimal totalCoefficient,
            BigDecimal incrementAmount
    ) {}

    /** Tính theo ngày công lưu trong cấu hình. */
    public static Result compute(SalaryIncrementConfig c, BigDecimal baseSalary) {
        short actual = c.getWorkdaysActual() != null ? c.getWorkdaysActual() : 22;
        short standard = c.getWorkdaysStandard() != null && c.getWorkdaysStandard() > 0
                ? c.getWorkdaysStandard() : 22;
        return compute(c, baseSalary, actual, standard);
    }

    /**
     * Tính với ngày công truyền vào — dùng khi sinh bảng lương để lấy
     * ngày công từ dữ liệu chấm công (một nguồn duy nhất) thay vì
     * số nhập tay trong cấu hình.
     */
    public static Result compute(SalaryIncrementConfig c, BigDecimal baseSalary,
                                 int workdaysActual, int workdaysStandard) {
        BigDecimal responsibilityTotal = c.getResponsibilityCoefficient()
                .add(c.getResponsibilitySecondaryCoefficient().multiply(new BigDecimal("0.25")))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal qualAdjusted = c.getQualificationCoefficient()
                .multiply(c.getQualificationAdjustment().factor())
                .multiply(c.getSpecialtyMultiplierPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .setScale(4, RoundingMode.HALF_UP);

        // Điều 34.6 (tr.53): HS = gốc + (gốc × %phụ_trội × %thời_gian_kiêm_nhiệm)
        BigDecimal concurrentDeptCoeff = qualAdjusted
                .multiply(c.getConcurrentDeptBonusPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .multiply(c.getConcurrentDeptTimePercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal totalCoeff = responsibilityTotal
                .add(qualAdjusted)
                .add(c.getConcurrentUnionCoefficient())
                .add(concurrentDeptCoeff);

        int standard = workdaysStandard > 0 ? workdaysStandard : 22;

        BigDecimal increment = baseSalary
                .multiply(totalCoeff)
                .multiply(c.getRatingPercentage().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP))
                .multiply(BigDecimal.valueOf(workdaysActual))
                .divide(BigDecimal.valueOf(standard), 6, RoundingMode.HALF_UP)
                .multiply(c.getPaymentMultiplier())
                .setScale(0, RoundingMode.HALF_UP);

        return new Result(responsibilityTotal, qualAdjusted, concurrentDeptCoeff, totalCoeff, increment);
    }
}
