package vn.hrm.app.auth;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chống brute-force / credential stuffing ở bước đăng nhập: đếm số lần đăng nhập
 * sai theo email và khóa tạm thời sau {@link #MAX_ATTEMPTS} lần trong cửa sổ
 * {@link #WINDOW}. Lưu trong bộ nhớ tiến trình — đủ cho triển khai monolith 1 node
 * on-premises; nếu chạy nhiều node cần chuyển sang Redis.
 *
 * <p>Lưu ý đánh đổi: khóa theo email có thể bị lợi dụng để khóa tài khoản người
 * khác (lockout-DoS). Cửa sổ ngắn (15') + chỉ khóa tạm giúp giảm tác động; có thể
 * bổ sung khóa theo IP hoặc CAPTCHA sau.
 */
@Service
public class LoginAttemptService {

    static final int MAX_ATTEMPTS = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_TRACKED = 50_000; // chặn map phình vô hạn khi bị spam email ngẫu nhiên

    private record Attempt(int count, Instant firstAt) {}

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    /** @return số phút còn bị khóa, hoặc 0 nếu không bị khóa. */
    public long lockedMinutesRemaining(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null) return 0;
        if (isExpired(a)) { attempts.remove(key(email)); return 0; }
        if (a.count() < MAX_ATTEMPTS) return 0;
        long remaining = Duration.between(Instant.now(), a.firstAt().plus(WINDOW)).toMinutes();
        return Math.max(1, remaining);
    }

    /** Ghi nhận 1 lần đăng nhập sai. */
    public void recordFailure(String email) {
        String k = key(email);
        attempts.compute(k, (kk, a) -> {
            if (a == null || isExpired(a)) return new Attempt(1, Instant.now());
            return new Attempt(a.count() + 1, a.firstAt());
        });
        if (attempts.size() > MAX_TRACKED) attempts.entrySet().removeIf(e -> isExpired(e.getValue()));
    }

    /** Xóa bộ đếm khi đăng nhập đúng. */
    public void reset(String email) {
        attempts.remove(key(email));
    }

    private boolean isExpired(Attempt a) {
        return Instant.now().isAfter(a.firstAt().plus(WINDOW));
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
