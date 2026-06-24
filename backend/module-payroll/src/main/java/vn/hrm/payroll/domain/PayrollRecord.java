package vn.hrm.payroll.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.hrm.payroll.domain.enums.PayrollStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "payroll", name = "payroll_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PayrollRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private Short periodYear;

    @Column(nullable = false)
    private Short periodMonth;

    // ── Thu nhập ──────────────────────────────────────────────────────────────

    /** Lương cơ bản đã tính theo ngày thực tế (basicSalary × coefficient × actualDays/workingDays) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    /** Tổng phụ cấp chịu thuế (ăn ca vượt 730k, đi lại, điện thoại, chức vụ, thâm niên, nhà ở, khác) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAllowance;

    /** Tổng phụ cấp độc hại & phần ăn ca miễn thuế — KHÔNG tính vào thu nhập chịu thuế & BHXH */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal taxExemptAllowance;

    /** Thưởng tháng (tính vào gross, chịu thuế TNCN) */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    /** Lương làm thêm giờ (150%/200%/300% tuỳ loại ngày) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal otPay;

    /** Gross = basicSalary + totalAllowance + taxExemptAllowance + bonus + otPay */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal grossSalary;

    // ── Khấu trừ phía nhân viên ───────────────────────────────────────────────

    /** BHXH nhân viên 8% — tính trên min(basicSalary, 20 × lương cơ sở = 46.8M) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhxhEmployee;

    /** BHYT nhân viên 1.5% */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhytEmployee;

    /** BHTN nhân viên 1% — tính trên min(basicSalary, 20 × lương vùng III = 72.8M) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhtnEmployee;

    /** Giảm trừ bản thân 11,000,000 VND/tháng */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal personalDeduction;

    /** Giảm trừ người phụ thuộc (số NP × 4,400,000 VND/tháng) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal dependentDeduction;

    /** Thu nhập chịu thuế TNCN sau tất cả giảm trừ */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal taxableIncome;

    /** Thuế TNCN lũy tiến 7 bậc (Điều 22 Luật Thuế TNCN) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pit;

    /** Các khấu trừ khác (kỷ luật, tạm ứng...) */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal otherDeduction;

    /** Tổng khấu trừ = BHXH + BHYT + BHTN + PIT + otherDeduction */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDeduction;

    /** Lương thực nhận = grossSalary - totalDeduction */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary;

    // ── Chi phí phía chủ sử dụng (để báo cáo tổng chi phí nhân sự) ──────────

    /** BHXH chủ sử dụng 17.5% (hưu trí 14% + ốm đau 3% + thai sản 0.5%) */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bhxhEmployer = BigDecimal.ZERO;

    /** BHYT chủ sử dụng 3% */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bhytEmployer = BigDecimal.ZERO;

    /** BHTN chủ sử dụng 1% */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bhtnEmployer = BigDecimal.ZERO;

    /** BHTNLĐ-BNN chủ sử dụng 0.5% */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bhtnldEmployer = BigDecimal.ZERO;

    /** Tổng chi phí chủ sử dụng = grossSalary + tất cả phần BHXH/BHYT/BHTN/BHTNLĐ chủ */
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalEmployerCost = BigDecimal.ZERO;

    // ── Chấm công & trạng thái ────────────────────────────────────────────────

    @Column(nullable = false)
    private Short workingDays;

    @Column(nullable = false)
    private Short actualDays;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal otHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PayrollStatus status;

    private String note;
    private String approvedBy;
    private LocalDateTime approvedAt;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
