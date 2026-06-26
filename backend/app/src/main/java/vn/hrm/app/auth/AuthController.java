package vn.hrm.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(req.email(), req.password())));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest req,
            Authentication auth) {
        String email = (String) auth.getPrincipal(); // JwtAuthFilter sets email as principal
        authService.changePassword(email, req.currentPassword(), req.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    public record LoginRequest(String email, String password) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
}
