package vn.hrm.payroll.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.hrm.payroll.domain.enums.QualificationAdjustment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lương tăng thêm (thu nhập tăng thêm - TNTT) — Điều 34/35 quy chế chi tiêu
 * nội bộ. Tách khỏi {@link SalaryConfig} (lương cơ bản) vì có nguồn hệ số
 * và chu kỳ xét duyệt riêng (Hội đồng thi đua, theo quý/năm).
 */
@Entity
@Table(schema = "payroll", name = "salary_increment_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryIncrementConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    /** Hệ số trách nhiệm/chức vụ chính (bảng payroll.responsibility_coefficients) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal responsibilityCoefficient = BigDecimal.ZERO;

    /** Kiêm nhiệm quản lý chức vụ thứ 2 — hưởng thêm 25% hệ số chức vụ này (tr.50) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal responsibilitySecondaryCoefficient = BigDecimal.ZERO;

    /** Hệ số trình độ chuyên môn, trước điều chỉnh (bảng payroll.qualification_coefficients) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal qualificationCoefficient = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QualificationAdjustment qualificationAdjustment = QualificationAdjustment.NONE;

    /** Hệ số kiêm nhiệm đoàn thể (bảng payroll.concurrent_role_coefficients) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal concurrentUnionCoefficient = BigDecimal.ZERO;

    /**
     * % hệ số đặc thù khoa/phòng (cấp cứu, hồi sức, ghép tạng...) — 110-135%,
     * áp lên hệ số trình độ đã điều chỉnh. 100 = không áp dụng.
     * Cần xác nhận danh sách khoa/phòng đặc thù với Phòng TCCB trước khi dùng số liệu thật.
     */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal specialtyMultiplierPercent = new BigDecimal("100");

    /** % cộng thêm do kiêm nhiệm khoa/phòng khác — 10 (BS/DS) hoặc 5 (ĐD/KTV) */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal concurrentDeptBonusPercent = BigDecimal.ZERO;

    /** % thời gian thực tế kiêm nhiệm khoa/phòng khác */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal concurrentDeptTimePercent = BigDecimal.ZERO;

    /** Mã xếp loại thi đua A1..C2 tại thời điểm hiệu lực (có thể null nếu chưa xếp loại) */
    @Column(length = 5)
    private String ratingCode;

    /** % xếp loại — snapshot tại effective_from để giữ nguyên lịch sử dù thang xếp loại thay đổi sau này */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal ratingPercentage = new BigDecimal("100");

    @Column(nullable = false)
    @Builder.Default
    private Short workdaysActual = 22;

    @Column(nullable = false)
    @Builder.Default
    private Short workdaysStandard = 22;

    @Column(nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal paymentMultiplier = BigDecimal.ONE;

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    /** DRAFT = chờ duyệt (không tính lương), APPROVED = đã duyệt (được tính vào bảng lương) */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    private String approvedBy;
    private LocalDateTime approvedAt;

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
