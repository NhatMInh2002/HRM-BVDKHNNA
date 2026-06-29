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

    @Value("${app.jwt.secret:hrm-secret-key-min-32-chars-long-for-hs256}")
    private String secret;

    @Value("${app.jwt.expiration-ms:86400000}") // 24h
    private long expirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        // Đảm bảo đủ 32 bytes cho HS256
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
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
