package vn.hrm.attendance.domain;

import jakarta.persistence.*;
import lombok.*;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.domain.enums.LeaveType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(schema = "attendance", name = "leave_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeaveType leaveType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal totalDays;

    @Column(length = 500)
    private String reason;

    @Column(length = 1000)
    private String attachmentUrl;

    @Column(length = 255)
    private String attachmentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveStatus status;

    // Cấp 1: Trưởng phòng
    @Column(length = 100)
    private String deptApprovedBy;
    private OffsetDateTime deptApprovedAt;
    @Column(length = 100)
    private String deptRejectedBy;
    private OffsetDateTime deptRejectedAt;
    @Column(length = 500)
    private String deptRejectNote;

    // Cấp 2: TCCB (HR)
    @Column(length = 100)
    private String hrApprovedBy;
    private OffsetDateTime hrApprovedAt;
    @Column(length = 100)
    private String hrRejectedBy;
    private OffsetDateTime hrRejectedAt;
    @Column(length = 500)
    private String hrRejectNote;

    // Legacy — giữ để tương thích
    @Column(length = 100)
    private String approvedBy;
    private OffsetDateTime approvedAt;

    // PDF được tạo khi TCCB duyệt xong
    @Column(length = 1000)
    private String pdfUrl;

    @Column(nullable = false, length = 100)
    private String createdBy;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = LeaveStatus.PENDING;
        }
    }
}
