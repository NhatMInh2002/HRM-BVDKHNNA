package vn.hrm.payroll.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Lương cơ sở theo thời gian hiệu lực — thay cho hằng số hard-code. */
@Entity
@Table(schema = "payroll", name = "base_salary_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BaseSalaryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, unique = true)
    private LocalDate effectiveFrom;

    @Column(length = 255)
    private String legalBasis;

    @Column(nullable = false)
    @Builder.Default
    private String createdBy = "system";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
