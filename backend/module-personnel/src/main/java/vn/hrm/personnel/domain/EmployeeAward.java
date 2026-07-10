package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/** Khen thưởng / Kỷ luật — mục 26-27 mẫu HS02-VC/BNV. */
@Entity
@Table(schema = "personnel", name = "employee_awards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeAward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    /** AWARD = khen thưởng, DISCIPLINE = kỷ luật */
    @Column(nullable = false, length = 20)
    private String type;

    private Short year;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 100)
    private String decisionNo;

    @Column(length = 150)
    private String level;

    @Column(nullable = false)
    @Builder.Default
    private Short displayOrder = 0;
}
