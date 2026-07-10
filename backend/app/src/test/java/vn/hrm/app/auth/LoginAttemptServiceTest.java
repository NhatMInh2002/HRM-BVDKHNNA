package vn.hrm.app.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    @Test
    void notLockedBeforeThreshold() {
        var svc = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS - 1; i++) {
            svc.recordFailure("a@bv.vn");
        }
        assertEquals(0, svc.lockedMinutesRemaining("a@bv.vn"),
                "Chưa đủ ngưỡng thì không được khóa");
    }

    @Test
    void lockedAtThreshold() {
        var svc = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            svc.recordFailure("b@bv.vn");
        }
        assertTrue(svc.lockedMinutesRemaining("b@bv.vn") > 0,
                "Đạt ngưỡng phải bị khóa và còn thời gian chờ");
    }

    @Test
    void resetClearsLock() {
        var svc = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            svc.recordFailure("c@bv.vn");
        }
        svc.reset("c@bv.vn");
        assertEquals(0, svc.lockedMinutesRemaining("c@bv.vn"),
                "Đăng nhập đúng (reset) phải xóa trạng thái khóa");
    }

    @Test
    void keyIsCaseAndSpaceInsensitive() {
        var svc = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            svc.recordFailure("  User@BV.VN ");
        }
        assertTrue(svc.lockedMinutesRemaining("user@bv.vn") > 0,
                "Email khác hoa/thường/khoảng trắng vẫn phải cùng bộ đếm");
    }
}
