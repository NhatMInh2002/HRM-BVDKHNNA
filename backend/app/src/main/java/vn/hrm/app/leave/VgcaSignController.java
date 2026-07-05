package vn.hrm.app.leave;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hrm.shared.dto.ApiResponse;

import java.util.Map;
import java.util.UUID;

/** TẠM ẨN — xem ghi chú ở {@link VgcaSignService}. Bật bằng app.vgca.enabled=true. */
@RestController
@ConditionalOnProperty(prefix = "app.vgca", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class VgcaSignController {

    private final VgcaSignService vgcaSignService;

    // ── Khởi tạo phiên ký — gọi từ trang duyệt nghỉ phép (yêu cầu đăng nhập) ──

    @PostMapping("/attendance/leave/{id}/dept-sign-init")
    @PreAuthorize("hasAnyRole('DEPT_HEAD','NURSE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deptSignInit(
            @PathVariable UUID id, Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(vgcaSignService.initDeptSign(id, email)));
    }

    @PostMapping("/attendance/leave/{id}/hr-sign-init")
    @PreAuthorize("hasAnyRole('HR_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> hrSignInit(
            @PathVariable UUID id, Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(vgcaSignService.initHrSign(id, email)));
    }

    // ── Gọi trực tiếp bởi tool VGCASignService trên máy người ký — KHÔNG có
    //    JWT của hệ thống, bảo mật bằng token một-lần (xem SecurityConfig) ──

    @GetMapping("/files/vgca-source")
    public ResponseEntity<byte[]> vgcaSource(@RequestParam String token) {
        byte[] data = vgcaSignService.readSourceFile(token);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=don-nghi-phep.pdf")
            .body(data);
    }

    /** Contract JSON cố định do VGCASignService quy định — KHÔNG bọc ApiResponse. */
    @PostMapping(value = "/files/vgca-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> vgcaUpload(
            @RequestParam String token,
            @RequestParam("uploadfile") MultipartFile uploadfile) {
        return ResponseEntity.ok(vgcaSignService.completeSign(token, uploadfile));
    }
}
