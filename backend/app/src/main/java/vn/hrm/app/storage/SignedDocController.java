package vn.hrm.app.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.exception.HrmException;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Hướng A — "Tải lên bản đã ký": người dùng tải PDF do hệ thống sinh (phiếu lương,
 * sơ yếu lý lịch HS02...), ký/đóng dấu bằng công cụ ngoài (KillerPDF, ký số USB...),
 * rồi tải bản đã ký lên đây để lưu trữ. Bản đã ký lưu ở MinIO theo key tất định
 * {@code documents/signed/{type}/{refId}.pdf} nên không cần bảng riêng — có/không
 * suy ra từ sự tồn tại của object.
 *
 * Xem/tải bản đã ký qua endpoint /files/view?key=... sẵn có.
 */
@RestController
@RequestMapping("/signed-docs")
@RequiredArgsConstructor
public class SignedDocController {

    private final StorageService storageService;

    private static final long MAX_SIZE = 15 * 1024 * 1024; // 15 MB
    // Chỉ cho phép các loại văn bản đã biết — chặn key tùy ý (path injection)
    private static final Set<String> ALLOWED_TYPES = Set.of("payslip", "hs02", "leave");

    private String keyOf(String type, UUID refId) {
        return "documents/signed/" + type + "/" + refId + ".pdf";
    }

    private String validateType(String type) {
        if (!ALLOWED_TYPES.contains(type)) {
            throw HrmException.badRequest("INVALID_DOC_TYPE",
                "Loại văn bản không hợp lệ (chỉ nhận: " + String.join(", ", ALLOWED_TYPES) + ")");
        }
        return type;
    }

    @PostMapping(value = "/{type}/{refId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @PathVariable String type,
            @PathVariable UUID refId,
            @RequestParam("file") MultipartFile file) {

        validateType(type);
        if (file.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("FILE_EMPTY", "File không được rỗng"));
        if (file.getSize() > MAX_SIZE)
            return ResponseEntity.badRequest().body(ApiResponse.error("FILE_TOO_LARGE", "File tối đa 15 MB"));

        byte[] data;
        try {
            data = file.getBytes();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("READ_FAILED", "Không đọc được file"));
        }
        // Kiểm tra magic bytes %PDF — chỉ nhận PDF thật, không nhận file đổi đuôi
        if (data.length < 5 || data[0] != '%' || data[1] != 'P' || data[2] != 'D' || data[3] != 'F') {
            return ResponseEntity.badRequest().body(ApiResponse.error("NOT_A_PDF", "Chỉ chấp nhận file PDF (.pdf)"));
        }

        String key = keyOf(type, refId);
        storageService.uploadBytes(data, key, "application/pdf");
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", "/api/files/view?key=" + key)));
    }

    /** Cho biết đã có bản đã ký chưa + URL xem/tải. */
    @GetMapping("/{type}/{refId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status(
            @PathVariable String type,
            @PathVariable UUID refId) {

        validateType(type);
        String key = keyOf(type, refId);
        boolean exists = storageService.readBytes(key) != null;
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "exists", exists,
            "url", exists ? "/api/files/view?key=" + key : ""
        )));
    }
}
