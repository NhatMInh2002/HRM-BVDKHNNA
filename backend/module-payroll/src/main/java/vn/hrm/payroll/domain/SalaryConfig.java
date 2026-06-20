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

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceFood;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceTransport;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowancePhone;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceOther;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal coefficient;

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
