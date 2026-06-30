package vn.hrm.app.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hrm.shared.dto.ApiResponse;
import vn.hrm.shared.exception.HrmException;

import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final StorageService storageService;

    private static final long MAX_SIZE = 10 * 1024 * 1024;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "misc") String folder) {

        if (file.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("FILE_EMPTY", "File không được rỗng"));
        if (file.getSize() > MAX_SIZE)
            return ResponseEntity.badRequest().body(ApiResponse.error("FILE_TOO_LARGE", "File tối đa 10 MB"));

        String key  = storageService.uploadDocument(file, folder);
        String name = file.getOriginalFilename();
        // Trả về key thay vì presigned URL — browser xem qua /files/view?key=...
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", "/api/files/view?key=" + key, "name", name)));
    }

    /**
     * Trả file từ MinIO qua backend — tránh expose MinIO URL ra ngoài.
     * Đọc đồng bộ (byte[]) thay vì StreamingResponseBody: body async của Spring MVC
     * chạy trên thread riêng không kế thừa SecurityContext (STATELESS + ThreadLocal),
     * gây AccessDeniedException "response already committed" khi ghi response.
     */
    @GetMapping("/view")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> view(@RequestParam String key) {
        // Strip bucket prefix nếu vô tình có trong key
        String resolvedKey = key.startsWith("hrm-avatars/")
                ? key.substring("hrm-avatars/".length()) : key;
        String contentType = storageService.getContentType(resolvedKey);
        byte[] data = storageService.readBytes(resolvedKey);
        if (data == null) throw HrmException.notFound("FILE_NOT_FOUND", "Không tìm thấy file: " + resolvedKey);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(data);
    }
}
