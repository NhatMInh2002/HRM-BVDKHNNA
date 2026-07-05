package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.hrm.personnel.domain.enums.ConcurrentRoleType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kiêm nhiệm khoa/phòng khác — Quyết định điều động/phân công của Giám đốc.
 * Là nguồn dữ liệu gốc cho hệ số kiêm nhiệm khoa/phòng khi cấu hình lương
 * tăng thêm (payroll.salary_increment_configs), tránh phải nhập tay lại
 * % thời gian kiêm nhiệm mỗi lần cấu hình lương.
 */
@Entity
@Table(schema = "personnel", name = "employee_concurrent_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeConcurrentAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /** Khoa/phòng được kiêm nhiệm (khác với department chính của nhân viên) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ConcurrentRoleType roleType;

    /** % thời gian thực tế làm việc tại khoa/phòng kiêm nhiệm */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal timePercent;

    @Column(length = 100)
    private String decisionNumber;   // số quyết định điều động/phân công

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;   // null = đang hiệu lực

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, length = 100)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
