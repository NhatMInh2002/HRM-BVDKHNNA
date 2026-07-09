package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/** Quá trình đào tạo, bồi dưỡng — mục 32 mẫu HS02-VC/BNV. */
@Entity
@Table(schema = "personnel", name = "employee_trainings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    private LocalDate fromDate;
    private LocalDate toDate;

    @Column(nullable = false, length = 300)
    private String institution;

    @Column(length = 200)
    private String field;

    @Column(length = 100)
    private String form;

    @Column(length = 200)
    private String degree;

    @Column(nullable = false)
    @Builder.Default
    private Short displayOrder = 0;
}
