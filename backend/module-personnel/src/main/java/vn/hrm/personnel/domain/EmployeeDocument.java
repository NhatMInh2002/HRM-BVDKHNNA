package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import vn.hrm.personnel.domain.enums.DocumentType;
import vn.hrm.personnel.domain.enums.OcrStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Hồ sơ (quyết định/bằng cấp/hợp đồng...) do Phòng TCCB upload cho nhân viên.
 * OCR + so khớp tự động chỉ tạo GỢI Ý (matched*) — không tự ghi vào
 * SalaryConfig/SalaryIncrementConfig; TCCB luôn phải xác nhận trước khi áp dụng.
 */
@Entity
@Table(schema = "personnel", name = "employee_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DocumentType docType;

    @Column(nullable = false, length = 1000)
    private String fileUrl;

    @Column(length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private OcrStatus ocrStatus = OcrStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    // ── Gợi ý so khớp (chỉ mang tính tham khảo) ─────────────────────────────
    @Column(length = 200)
    private String matchedLabel;

    @Column(precision = 5, scale = 2)
    private BigDecimal matchedCoefficient;

    private UUID matchedDepartmentId;

    @Column(length = 10)
    private String matchedRoleType;

    @Column(precision = 5, scale = 2)
    private BigDecimal matchedTimePercent;

    @Column(length = 20)
    private String matchConfidence;   // HIGH | LOW

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    private String verifiedBy;
    private LocalDateTime verifiedAt;

    @Column(nullable = false, length = 100)
    private String uploadedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
