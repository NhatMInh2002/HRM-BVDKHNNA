package vn.hrm.payroll.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "payroll", name = "salary_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    /** Lương cơ bản (trước hệ số) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    // ── Phụ cấp ──────────────────────────────────────────────────────────────

    /** Phụ cấp ăn ca — miễn thuế TNCN ≤ 730,000 VND/tháng (CV 1580/TCT-TNCN) */
    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceFood;

    /** Phụ cấp đi lại/xăng xe */
    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceTransport;

    /** Phụ cấp điện thoại */
    @Column(precision = 15, scale = 2)
    private BigDecimal allowancePhone;

    /** Phụ cấp chức vụ */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowancePosition = BigDecimal.ZERO;

    /** Phụ cấp thâm niên */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowanceSeniority = BigDecimal.ZERO;

    /**
     * Phụ cấp độc hại/nguy hiểm — MIỄN BHXH và MIỄN thuế TNCN.
     * Căn cứ: Thông tư 111/2013/TT-BTC Điều 2.2.g
     */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowanceToxic = BigDecimal.ZERO;

    /** Phụ cấp nhà ở */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowanceHouse = BigDecimal.ZERO;

    /** Phụ cấp khác chịu thuế */
    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceOther;

    // ── Hệ số & thuế ─────────────────────────────────────────────────────────

    /** Hệ số lương (thường 1.0 – 8.0 theo thang bảng lương đơn vị) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal coefficient = BigDecimal.ONE;

    /**
     * Số người phụ thuộc được đăng ký giảm trừ TNCN.
     * Mỗi người giảm 4,400,000 VND/tháng khỏi thu nhập chịu thuế.
     */
    @Column(nullable = false)
    @Builder.Default
    private Short dependents = 0;

    /**
     * TRUE nếu không thuộc đối tượng đóng BHXH bắt buộc
     * (hợp đồng < 1 tháng, hợp đồng khoán việc...).
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean bhxhExempt = Boolean.FALSE;

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
