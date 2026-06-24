package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.Department;

import java.util.List;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String code,
        String name,
        UUID parentId,
        String parentName,
        List<DepartmentResponse> children
) {
    public static DepartmentResponse of(Department d) {
        return new DepartmentResponse(
                d.getId(),
                d.getCode(),
                d.getName(),
                d.getParent() != null ? d.getParent().getId() : null,
                d.getParent() != null ? d.getParent().getName() : null,
                d.getChildren() != null
                        ? d.getChildren().stream().map(DepartmentResponse::flat).toList()
                        : List.of()
        );
    }

    /** Flat version (không đệ quy children) — dùng cho dropdown */
    public static DepartmentResponse flat(Department d) {
        return new DepartmentResponse(
                d.getId(),
                d.getCode(),
                d.getName(),
                d.getParent() != null ? d.getParent().getId() : null,
                d.getParent() != null ? d.getParent().getName() : null,
                List.of()
        );
    }
}
