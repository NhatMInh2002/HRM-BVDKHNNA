package vn.hrm.app.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.exception.HrmException;

import java.util.Map;

@RestController
@RequestMapping("/personnel/employees/me")
@RequiredArgsConstructor
public class AvatarController {

    private final StorageService storageService;
    private final EmployeeRepository employeeRepository;

    @PostMapping(value = "/signature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadSignature(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        if (file.isEmpty()) throw HrmException.badRequest("EMPTY_FILE", "Vui lòng chọn file ảnh chữ ký");
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/"))
            throw HrmException.badRequest("INVALID_TYPE", "Chữ ký phải là file ảnh (jpg, png)");
        if (file.getSize() > 2 * 1024 * 1024)
            throw HrmException.badRequest("FILE_TOO_LARGE", "Ảnh chữ ký không được vượt quá 2MB");

        String email = (String) auth.getPrincipal();
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên"));

        String key = storageService.uploadDocument(file, "signatures");
        String url = "/api/files/view?key=" + key;
        employee.setSignatureUrl(url);
        employeeRepository.save(employee);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("signatureUrl", url)));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        if (file.isEmpty()) throw HrmException.badRequest("EMPTY_FILE", "Vui lòng chọn file ảnh");

        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/"))
            throw HrmException.badRequest("INVALID_TYPE", "Chỉ chấp nhận file ảnh (jpg, png, webp)");

        if (file.getSize() > 5 * 1024 * 1024)
            throw HrmException.badRequest("FILE_TOO_LARGE", "Ảnh không được vượt quá 5MB");

        String email = (String) auth.getPrincipal();
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên"));

        String key = storageService.uploadAvatar(file);
        String url = "/api/files/view?key=" + key;
        employee.setAvatarUrl(url);
        employeeRepository.save(employee);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("avatarUrl", url)));
    }
}
