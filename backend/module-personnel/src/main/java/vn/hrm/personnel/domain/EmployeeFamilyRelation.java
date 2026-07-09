package vn.hrm.personnel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/** Quan hệ gia đình — mục 33-34 mẫu HS02-VC/BNV (bản thân + bên vợ/chồng). */
@Entity
@Table(schema = "personnel", name = "employee_family_relations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeFamilyRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    /** SELF = quan hệ bản thân, SPOUSE = bên vợ/chồng */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String side = "SELF";

    /** Cha, Mẹ, Vợ, Chồng, Con, Anh/Chị/Em ruột... */
    @Column(nullable = false, length = 50)
    private String relation;

    @Column(nullable = false, length = 150)
    private String fullName;

    private Short birthYear;

    /** Quê quán, nghề nghiệp, chức danh, nơi ở hiện nay... */
    @Column(length = 500)
    private String detail;

    @Column(nullable = false)
    @Builder.Default
    private Short displayOrder = 0;
}
