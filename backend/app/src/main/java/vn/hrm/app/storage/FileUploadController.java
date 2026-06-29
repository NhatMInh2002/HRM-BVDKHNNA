package vn.hrm.app.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import vn.hrm.shared.dto.ApiResponse;

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

    /** Stream file từ MinIO qua backend — tránh expose MinIO URL ra ngoài. */
    @GetMapping("/view")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StreamingResponseBody> view(@RequestParam String key) {
        // Strip bucket prefix nếu vô tình có trong key — dùng final var cho lambda
        final String resolvedKey = key.startsWith("hrm-avatars/")
                ? key.substring("hrm-avatars/".length()) : key;
        String contentType = storageService.getContentType(resolvedKey);
        StreamingResponseBody body = out -> {
            try (var in = storageService.getObject(resolvedKey)) {
                in.transferTo(out);
            } catch (Exception e) {
                throw new java.io.IOException("Lỗi đọc file: " + e.getMessage(), e);
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(body);
    }
}
