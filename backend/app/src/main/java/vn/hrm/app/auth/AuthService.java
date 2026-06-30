package vn.hrm.app.auth;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeePermissionRepository;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.exception.HrmException;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String ISSUER = "BVHN Nghệ An";

    private final EmployeeRepository employeeRepository;
    private final EmployeePermissionRepository permissionRepository;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final QrCodeService qrCodeService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy tài khoản"));

        if (employee.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            throw HrmException.badRequest("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw HrmException.badRequest("WEAK_PASSWORD", "Mật khẩu mới phải có ít nhất 8 ký tự");
        }

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }

    /** Admin đặt lại mật khẩu cho nhân viên — không cần mật khẩu cũ */
    @Transactional
    public void adminResetPassword(UUID employeeId, String newPassword) {
        if (newPassword == null || newPassword.length() < 8)
            throw HrmException.badRequest("WEAK_PASSWORD", "Mật khẩu phải có ít nhất 8 ký tự");

        var employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên"));

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }

    public Map<String, Object> login(String email, String password) {
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (employee.getPasswordHash() == null) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt, liên hệ quản trị viên");
        }

        if (!passwordEncoder.matches(password, employee.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không đúng");
        }

        if (employee.isTotpEnabled()) {
            String pendingToken = jwtService.generatePending2faToken(employee.getId(), employee.getEmail());
            return Map.of(
                    "requires2fa",  true,
                    "pendingToken", pendingToken
            );
        }

        return issueFullToken(employee);
    }

    /** Bước 2 của login khi 2FA bật — đổi pendingToken + mã TOTP lấy JWT đầy đủ. */
    public Map<String, Object> verifyLoginTotp(String pendingToken, String code) {
        Claims claims = parsePendingToken(pendingToken);
        UUID employeeId = UUID.fromString(claims.get("employeeId", String.class));

        var employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy tài khoản"));

        if (!employee.isTotpEnabled() || employee.getTotpSecret() == null) {
            throw HrmException.badRequest("2FA_NOT_ENABLED", "Tài khoản chưa bật 2FA");
        }
        if (!totpService.verifyCode(employee.getTotpSecret(), code)) {
            throw HrmException.badRequest("INVALID_CODE", "Mã xác thực không đúng hoặc đã hết hạn");
        }

        return issueFullToken(employee);
    }

    /** Bắt đầu thiết lập 2FA — sinh secret mới (chưa bật), trả QR code để quét. */
    @Transactional
    public Map<String, Object> setupTotp(String email) {
        var employee = findByEmail(email);
        String secret = totpService.generateSecret();
        employee.setTotpSecret(secret);
        employee.setTotpEnabled(false);
        employeeRepository.save(employee);

        String otpAuthUri = totpService.buildOtpAuthUri(secret, employee.getEmail(), ISSUER);
        String qrDataUri = qrCodeService.generateQrDataUri(otpAuthUri, 240);

        return Map.of(
                "secret",    secret,
                "qrCodeUri", qrDataUri
        );
    }

    /** Xác nhận mã từ Authenticator app — bật 2FA thật sự. */
    @Transactional
    public void confirmTotp(String email, String code) {
        var employee = findByEmail(email);
        if (employee.getTotpSecret() == null) {
            throw HrmException.badRequest("NO_PENDING_SETUP", "Chưa khởi tạo thiết lập 2FA");
        }
        if (!totpService.verifyCode(employee.getTotpSecret(), code)) {
            throw HrmException.badRequest("INVALID_CODE", "Mã xác thực không đúng");
        }
        employee.setTotpEnabled(true);
        employee.setTotpConfirmedAt(OffsetDateTime.now());
        employeeRepository.save(employee);
    }

    @Transactional
    public void disableTotp(String email, String currentPassword) {
        var employee = findByEmail(email);
        if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            throw HrmException.badRequest("WRONG_PASSWORD", "Mật khẩu không đúng");
        }
        employee.setTotpEnabled(false);
        employee.setTotpSecret(null);
        employee.setTotpConfirmedAt(null);
        employeeRepository.save(employee);
    }

    public Map<String, Object> totpStatus(String email) {
        var employee = findByEmail(email);
        return Map.of("enabled", employee.isTotpEnabled());
    }

    private Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy tài khoản"));
    }

    private Claims parsePendingToken(String pendingToken) {
        Claims claims;
        try {
            claims = jwtService.parseToken(pendingToken);
        } catch (Exception e) {
            throw HrmException.badRequest("INVALID_TOKEN", "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        }
        if (!"2fa_pending".equals(claims.get("stage", String.class))) {
            throw HrmException.badRequest("INVALID_TOKEN", "Token không hợp lệ cho bước xác thực 2FA");
        }
        return claims;
    }

    private Map<String, Object> issueFullToken(Employee employee) {
        String role = employee.getHrmRole() != null ? employee.getHrmRole() : "EMPLOYEE";
        Set<String> permissions = permissionRepository.findPermissionsByEmployeeId(employee.getId());

        String token = jwtService.generateToken(
                employee.getId(), employee.getEmail(), employee.getFullName(), role, permissions);

        return Map.of(
                "token",       token,
                "employeeId",  employee.getId().toString(),
                "email",       employee.getEmail(),
                "fullName",    employee.getFullName(),
                "role",        role,
                "permissions", permissions
        );
    }
}
