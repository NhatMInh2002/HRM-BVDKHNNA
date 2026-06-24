package vn.hrm.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;

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
