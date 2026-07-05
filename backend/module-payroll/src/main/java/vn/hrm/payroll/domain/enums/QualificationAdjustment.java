package vn.hrm.payroll.domain.enums;

import java.math.BigDecimal;

/**
 * Điều chỉnh hệ số trình độ theo Điều 34, tr.49-50:
 * thiếu CCHN → 85%; bằng liên thông → 95%.
 */
public enum QualificationAdjustment {
    NONE(BigDecimal.ONE),
    MISSING_LICENSE(new BigDecimal("0.85")),
    BRIDGE_DEGREE(new BigDecimal("0.95"));

    private final BigDecimal factor;

    QualificationAdjustment(BigDecimal factor) {
        this.factor = factor;
    }

    public BigDecimal factor() {
        return factor;
    }
}
