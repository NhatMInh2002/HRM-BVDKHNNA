package vn.hrm.personnel.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.dto.EmployeeProfileDto;
import vn.hrm.personnel.service.EmployeeProfileService;
import vn.hrm.personnel.service.ProfilePdfService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.UUID;

/**
 * Hồ sơ lý lịch HS02-VC/BNV: đọc/ghi các trường mở rộng + 4 danh sách con,
 * và xuất PDF theo mẫu.
 */
@RestController
@RequestMapping("/personnel/employees/{employeeId}/profile")
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileService profileService;
    private final ProfilePdfService pdfService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> get(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.get(employeeId)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> save(
            @PathVariable UUID employeeId, @RequestBody EmployeeProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.save(employeeId, dto)));
    }

    @GetMapping("/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID employeeId) throws Exception {
        byte[] bytes = pdfService.generate(employeeId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"so-yeu-ly-lich-" + employeeId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
