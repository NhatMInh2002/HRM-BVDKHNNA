package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.domain.enums.Gender;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "personnel", name = "employees")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String employeeCode;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate dateOfBirth;

    // CCCD — không log, mã hóa ở tầng DB
    @Column(length = 12)
    private String nationalId;

    private LocalDate joinDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeStatus status;

    @Enumerated(EnumType.STRING)
    private ContractType contractType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(length = 100)
    private String position;

    @Column(length = 100)
    private String educationLevel;

    @Column(length = 50)
    private String ethnicity;

    @Column(length = 50)
    private String religion;

    @Column(length = 200)
    private String hometown;

    @Column(length = 200)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private String createdBy;

    @Column(length = 50)
    private String hrmRole;

    @Column(length = 255)
    private String passwordHash;

    @Column(length = 500)
    private String avatarUrl;

    @Column(length = 500)
    private String signatureUrl;

    @Column(length = 64)
    private String totpSecret;

    @Column(nullable = false)
    private boolean totpEnabled;

    private java.time.OffsetDateTime totpConfirmedAt;
}
