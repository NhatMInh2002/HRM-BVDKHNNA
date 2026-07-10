package vn.hrm.app.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${app.jwt.secret:}")
    private String secret;

    @Value("${app.jwt.expiration-ms:86400000}") // 24h
    private long expirationMs;

    private SecretKey key;

    /** Các giá trị mặc định từng ship kèm mã nguồn — TUYỆT ĐỐI không được dùng ở production. */
    private static final java.util.Set<String> WEAK_DEFAULTS = java.util.Set.of(
            "hrm-secret-key-min-32-chars-long-for-hs256",
            "hrm-bvnghean-secret-key-2025-must-be-at-least-32-chars");

    @PostConstruct
    public void init() {
        // Fail-fast: không cho khởi động với secret trống, secret mặc định công khai,
        // hoặc secret quá ngắn (< 32 byte). Trước đây secret ngắn bị zero-pad làm giảm entropy,
        // và thiếu JWT_SECRET thì âm thầm dùng chuỗi nằm trong repo → giả mạo được token ADMIN.
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "Chưa cấu hình JWT_SECRET. Đặt biến môi trường JWT_SECRET (>= 32 ký tự ngẫu nhiên) trước khi chạy.");
        }
        if (WEAK_DEFAULTS.contains(secret)) {
            throw new IllegalStateException(
                    "JWT_SECRET đang dùng giá trị mặc định công khai trong mã nguồn — hãy đổi sang chuỗi bí mật riêng.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET quá ngắn (" + bytes.length + " byte) — cần tối thiểu 32 byte cho HS256.");
        }
        key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(UUID employeeId, String email, String fullName, String role,
                                Collection<String> permissions) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claims(Map.of(
                        "employeeId",  employeeId.toString(),
                        "fullName",    fullName,
                        "role",        role,
                        "roles",       new String[]{ role },
                        "permissions", permissions
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Backward-compat — không có permissions */
    public String generateToken(UUID employeeId, String email, String fullName, String role) {
        return generateToken(employeeId, email, fullName, role, java.util.List.of());
    }

    /**
     * Token tạm (5 phút) dùng giữa bước 1 (mật khẩu đúng) và bước 2 (nhập mã TOTP) khi 2FA bật.
     * Không chứa role/permissions — không thể dùng để gọi API thường, chỉ hợp lệ ở endpoint xác minh 2FA.
     */
    public String generatePending2faToken(UUID employeeId, String email) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claims(Map.of("employeeId", employeeId.toString(), "stage", "2fa_pending"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 5 * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
