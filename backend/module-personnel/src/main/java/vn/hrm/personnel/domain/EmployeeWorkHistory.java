package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/** Quá trình công tác — mục 31 mẫu HS02-VC/BNV. */
@Entity
@Table(schema = "personnel", name = "employee_work_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeWorkHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private LocalDate fromDate;

    private LocalDate toDate;

    @Column(nullable = false, length = 300)
    private String unit;

    @Column(length = 200)
    private String position;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    @Builder.Default
    private Short displayOrder = 0;
}
