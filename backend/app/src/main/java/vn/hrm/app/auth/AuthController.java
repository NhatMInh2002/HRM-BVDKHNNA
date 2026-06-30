package vn.hrm.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(req.email(), req.password())));
    }

    /** Bước 2 — nhập mã 6 số từ Authenticator app khi tài khoản đã bật 2FA */
    @PostMapping("/2fa/verify-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyLoginTotp(@RequestBody Verify2faRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(authService.verifyLoginTotp(req.pendingToken(), req.code())));
    }

    /** Khởi tạo thiết lập 2FA cho chính mình — trả secret + QR code để quét */
    @PostMapping("/2fa/setup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setupTotp(Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(authService.setupTotp(email)));
    }

    /** Xác nhận mã từ app — bật 2FA thật sự */
    @PostMapping("/2fa/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmTotp(@RequestBody ConfirmTotpRequest req, Authentication auth) {
        String email = (String) auth.getPrincipal();
        authService.confirmTotp(email, req.code());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** Tắt 2FA — cần nhập lại mật khẩu để xác nhận */
    @PostMapping("/2fa/disable")
    public ResponseEntity<ApiResponse<Void>> disableTotp(@RequestBody DisableTotpRequest req, Authentication auth) {
        String email = (String) auth.getPrincipal();
        authService.disableTotp(email, req.password());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/2fa/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> totpStatus(Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(authService.totpStatus(email)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest req,
            Authentication auth) {
        String email = (String) auth.getPrincipal(); // JwtAuthFilter sets email as principal
        authService.changePassword(email, req.currentPassword(), req.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/admin/reset-password")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> adminResetPassword(
            @RequestBody AdminResetRequest req) {
        authService.adminResetPassword(req.employeeId(), req.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    public record LoginRequest(String email, String password) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
    public record AdminResetRequest(UUID employeeId, String newPassword) {}
    public record Verify2faRequest(String pendingToken, String code) {}
    public record ConfirmTotpRequest(String code) {}
    public record DisableTotpRequest(String password) {}
}
