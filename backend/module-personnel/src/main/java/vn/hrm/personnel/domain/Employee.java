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

    // CCCD — không log; mã hóa AES-GCM khi lưu (NĐ 13/2023)
    @Convert(converter = vn.hrm.shared.crypto.EncryptedPiiConverter.class)
    @Column(length = 255)
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

    // ── Hồ sơ lý lịch HS02-VC/BNV (TT 07/2019/TT-BNV) — V39 ─────────────────

    @Column(length = 200)
    private String birthPlace;

    private LocalDate nationalIdIssueDate;

    @Column(length = 200)
    private String nationalIdIssuePlace;

    /** Số sổ BHXH — mã hóa (NĐ 13/2023) */
    @Convert(converter = vn.hrm.shared.crypto.EncryptedPiiConverter.class)
    @Column(length = 255)
    private String socialInsuranceNo;

    /** Số thẻ BHYT — mã hóa (NĐ 13/2023) */
    @Convert(converter = vn.hrm.shared.crypto.EncryptedPiiConverter.class)
    @Column(length = 255)
    private String healthInsuranceNo;

    @Column(length = 100)
    private String familyOrigin;

    @Column(length = 200)
    private String jobBeforeRecruitment;

    private LocalDate recruitmentDate;

    @Column(length = 200)
    private String recruitmentAgency;

    @Column(length = 20)
    private String ngachCode;

    private Short salaryGrade;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal salaryCoefficient;

    private LocalDate salaryEffectiveDate;

    @Column(length = 50)
    private String educationGeneral;

    @Column(length = 200)
    private String professionalDegree;

    @Column(length = 100)
    private String politicalTheory;

    @Column(length = 100)
    private String stateManagement;

    @Column(length = 200)
    private String foreignLanguage;

    @Column(length = 100)
    private String informaticsLevel;

    private LocalDate partyJoinDate;
    private LocalDate partyOfficialDate;
    private LocalDate youthUnionJoinDate;
    private LocalDate militaryServiceFrom;
    private LocalDate militaryServiceTo;

    @Column(length = 50)
    private String warInvalidClass;

    @Column(length = 100)
    private String policyFamilyType;

    /** Tình trạng sức khỏe — mã hóa (NĐ 13/2023, dữ liệu sức khỏe nhạy cảm) */
    @Convert(converter = vn.hrm.shared.crypto.EncryptedPiiConverter.class)
    @Column(length = 255)
    private String healthStatus;

    private Short heightCm;
    private Short weightKg;

    @Column(length = 10)
    private String bloodType;

    @Column(columnDefinition = "TEXT")
    private String personalHistory;

    @Column(columnDefinition = "TEXT")
    private String familyEconomy;
}
