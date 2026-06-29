package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(schema = "personnel", name = "employee_permissions")
@IdClass(EmployeePermissionId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class EmployeePermission {

    @Id
    @Column(name = "employee_id")
    private UUID employeeId;

    @Id
    @Column(name = "permission", length = 60)
    private String permission;

    @Column(name = "granted_at")
    private OffsetDateTime grantedAt;

    @Column(name = "granted_by", length = 100)
    private String grantedBy;

    @PrePersist
    void onPersist() {
        if (grantedAt == null) grantedAt = OffsetDateTime.now();
    }
}
