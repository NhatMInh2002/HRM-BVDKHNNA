package vn.hrm.payroll.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.hrm.payroll.domain.SalaryIncrementConfig;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Kiểm chứng công thức TNTT bằng ví dụ tính tay cụ thể (không cần DB).
 * Lương cơ sở dùng 2.530.000 (từ 01/07/2026).
 */
class SalaryIncrementCalculatorTest {

    private static final BigDecimal LUONG_CO_SO = new BigDecimal("2530000");

    private SalaryIncrementConfig.SalaryIncrementConfigBuilder base() {
        return SalaryIncrementConfig.builder()
                .responsibilityCoefficient(BigDecimal.ZERO)
                .responsibilitySecondaryCoefficient(BigDecimal.ZERO)
                .qualificationCoefficient(BigDecimal.ZERO)
                .qualificationAdjustment(QualificationAdjustment.NONE)
                .concurrentUnionCoefficient(BigDecimal.ZERO)
                .specialtyMultiplierPercent(new BigDecimal("100"))
                .concurrentDeptBonusPercent(BigDecimal.ZERO)
                .concurrentDeptTimePercent(BigDecimal.ZERO)
                .ratingPercentage(new BigDecimal("100"))
                .workdaysActual((short) 22)
                .workdaysStandard((short) 22)
                .paymentMultiplier(BigDecimal.ONE);
    }

    @Test
    @DisplayName("Bác sĩ, Trưởng khoa, xếp loại A1, đủ công — TNTT = 16.445.000đ")
    void truongKhoaBacSiA1() {
        // Trách nhiệm 3.1 + trình độ 3.4 (×100%×100%) = tổng hệ số 6.5
        // TNTT = 2.530.000 × 6.5 × 100% × 22/22 × 1 = 16.445.000
        SalaryIncrementConfig c = base()
                .responsibilityCoefficient(new BigDecimal("3.1"))
                .qualificationCoefficient(new BigDecimal("3.4"))
                .build();

        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO);

        assertEquals(new BigDecimal("6.5000"), r.totalCoefficient());
        assertEquals(0, r.incrementAmount().compareTo(new BigDecimal("16445000")),
                "TNTT phải bằng 16.445.000đ, thực tế = " + r.incrementAmount());
    }

    @Test
    @DisplayName("Kiêm nhiệm chức vụ thứ 2 hưởng 25% hệ số")
    void kiemNhiemChucVuThu2() {
        // Chính 3.1 + 25% × 2.0 (phụ) = 3.1 + 0.5 = 3.6
        SalaryIncrementConfig c = base()
                .responsibilityCoefficient(new BigDecimal("3.1"))
                .responsibilitySecondaryCoefficient(new BigDecimal("2.0"))
                .build();

        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO);
        assertEquals(new BigDecimal("3.6000"), r.responsibilityTotal());
    }

    @Test
    @DisplayName("Thiếu CCHN (85%) + đặc thù khoa 120% áp lên hệ số trình độ")
    void thieuCchnVaDacThu() {
        // 3.4 × 0.85 × 1.20 = 3.468
        SalaryIncrementConfig c = base()
                .qualificationCoefficient(new BigDecimal("3.4"))
                .qualificationAdjustment(QualificationAdjustment.MISSING_LICENSE)
                .specialtyMultiplierPercent(new BigDecimal("120"))
                .build();

        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO);
        assertEquals(new BigDecimal("3.4680"), r.qualificationAdjusted());
    }

    @Test
    @DisplayName("Xếp loại C2 (0%) — mất toàn bộ TNTT")
    void xepLoaiC2MatToanBo() {
        SalaryIncrementConfig c = base()
                .responsibilityCoefficient(new BigDecimal("3.1"))
                .qualificationCoefficient(new BigDecimal("3.4"))
                .ratingPercentage(BigDecimal.ZERO)
                .build();

        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO);
        assertEquals(0, r.incrementAmount().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("Ngày công thực tế theo chấm công (18/22) làm giảm TNTT tương ứng")
    void ngayCongThucTeTuChamCong() {
        SalaryIncrementConfig c = base()
                .responsibilityCoefficient(new BigDecimal("3.1"))
                .qualificationCoefficient(new BigDecimal("3.4"))
                .build();

        // Overload nhận ngày công từ chấm công: 18/22 ngày
        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO, 18, 22);
        // 16.445.000 × 18/22 = 13.455.000
        assertEquals(0, r.incrementAmount().compareTo(new BigDecimal("13455000")),
                "TNTT theo 18/22 công phải = 13.455.000đ, thực tế = " + r.incrementAmount());
    }

    @Test
    @DisplayName("Xếp loại A2 (80%) nhân đúng vào TNTT")
    void xepLoaiA2() {
        SalaryIncrementConfig c = base()
                .responsibilityCoefficient(new BigDecimal("3.1"))
                .qualificationCoefficient(new BigDecimal("3.4"))
                .ratingPercentage(new BigDecimal("80"))
                .build();

        var r = SalaryIncrementCalculator.compute(c, LUONG_CO_SO);
        // 16.445.000 × 80% = 13.156.000
        assertEquals(0, r.incrementAmount().compareTo(new BigDecimal("13156000")),
                "thực tế = " + r.incrementAmount());
    }
}
