package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.hrm.personnel.domain.enums.ContractStatus;
import vn.hrm.personnel.domain.enums.ContractType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "personnel", name = "contracts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, unique = true, length = 50)
    private String contractNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;   // null = không xác định thời hạn

    @Column(nullable = false)
    private LocalDate signDate;

    @Column(length = 100)
    private String signerName;

    @Column(length = 100)
    private String position;

    @Column(length = 150)
    private String departmentName;

    private BigDecimal baseSalary;

    @Column(length = 20)
    private String salaryGrade;

    @Column(precision = 5, scale = 3)
    private BigDecimal salaryCoefficient;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowancePosition;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceSeniority;

    @Column(precision = 15, scale = 2)
    private BigDecimal allowanceOther;

    @Column(length = 1000)
    private String attachmentUrl;

    @Column(length = 255)
    private String attachmentName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 100)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
