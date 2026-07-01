package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.Department;
import vn.hrm.personnel.domain.Employee;

import java.util.List;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String code,
        String name,
        UUID parentId,
        String parentName,
        UUID managerId,
        String managerName,
        String managerPhone,
        String contactPhone,
        String dutyPhone,
        List<DepartmentResponse> children
) {
    public static DepartmentResponse of(Department d) {
        return build(d, d.getChildren() != null
                ? d.getChildren().stream().map(DepartmentResponse::flat).toList()
                : List.of());
    }

    /** Flat version (không đệ quy children) — dùng cho dropdown */
    public static DepartmentResponse flat(Department d) {
        return build(d, List.of());
    }

    private static DepartmentResponse build(Department d, List<DepartmentResponse> children) {
        Employee m = d.getManager();
        return new DepartmentResponse(
                d.getId(),
                d.getCode(),
                d.getName(),
                d.getParent() != null ? d.getParent().getId() : null,
                d.getParent() != null ? d.getParent().getName() : null,
                m != null ? m.getId() : null,
                m != null ? m.getFullName() : null,
                m != null ? m.getPhone() : null,
                d.getContactPhone(),
                d.getDutyPhone(),
                children
        );
    }
}
