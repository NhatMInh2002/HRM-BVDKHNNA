package vn.hrm.payroll.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Hệ số đặc thù khoa/phòng (%) áp lên hệ số trình độ TNTT — Điều 34 tr.52. */
@Entity
@Table(schema = "payroll", name = "specialty_department_multipliers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SpecialtyDepartmentMultiplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private UUID departmentId;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percent = new BigDecimal("100");

    @Column(length = 255)
    private String note;

    @Column(length = 100)
    private String updatedBy;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
