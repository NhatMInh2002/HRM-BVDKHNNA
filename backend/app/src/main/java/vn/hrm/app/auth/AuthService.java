package vn.hrm.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.exception.HrmException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;
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

    public Map<String, Object> login(String email, String password) {
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (employee.getPasswordHash() == null) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt, liên hệ quản trị viên");
        }

        if (!passwordEncoder.matches(password, employee.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không đúng");
        }

        String role = employee.getHrmRole() != null ? employee.getHrmRole() : "EMPLOYEE";
        String token = jwtService.generateToken(
                employee.getId(), employee.getEmail(), employee.getFullName(), role);

        return Map.of(
                "token",      token,
                "employeeId", employee.getId().toString(),
                "email",      employee.getEmail(),
                "fullName",   employee.getFullName(),
                "role",       role
        );
    }
}
