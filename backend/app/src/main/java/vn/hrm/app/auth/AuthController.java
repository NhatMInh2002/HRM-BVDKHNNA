package vn.hrm.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    public record LoginRequest(String email, String password) {}
}
