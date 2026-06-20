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

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAllowance;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal otPay;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhxhEmployee;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhytEmployee;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bhtnEmployee;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pit;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal otherDeduction;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDeduction;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary;

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
