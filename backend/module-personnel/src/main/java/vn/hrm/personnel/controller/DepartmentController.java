package vn.hrm.personnel.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.dto.DepartmentResponse;
import vn.hrm.personnel.service.DepartmentService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/personnel/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    /** Danh sách phẳng — dùng cho dropdown chọn phòng ban */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.findAll()));
    }

    /** Cây phân cấp — dùng cho org chart */
    @GetMapping("/tree")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> tree() {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.findTree()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.findById(id)));
    }
}
