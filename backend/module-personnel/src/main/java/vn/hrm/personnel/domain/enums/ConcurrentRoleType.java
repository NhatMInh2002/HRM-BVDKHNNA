package vn.hrm.personnel.domain.enums;

import java.math.BigDecimal;

/**
 * Loại kiêm nhiệm khoa/phòng khác — Điều 34.6 quy chế chi tiêu nội bộ, tr.53.
 * BS/DS kiêm nhiệm: +10% hệ số trình độ; Điều dưỡng/KTV: +5%.
 */
public enum ConcurrentRoleType {
    BS_DS(new BigDecimal("10")),
    DD_KTV(new BigDecimal("5"));

    private final BigDecimal bonusPercent;

    ConcurrentRoleType(BigDecimal bonusPercent) {
        this.bonusPercent = bonusPercent;
    }

    public BigDecimal bonusPercent() {
        return bonusPercent;
    }
}
