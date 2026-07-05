package vn.hrm.app.leave;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.hrm.app.storage.StorageService;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.repository.LeaveRequestRepository;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.exception.HrmException;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Ký số văn bản đơn nghỉ phép qua VGCASignService (Ban Cơ yếu Chính phủ,
 * Nghị định 30/2020/NĐ-CP) — tool cài trên máy người ký (USB Token), giao
 * tiếp qua vgcaplugin.js (WebSocket cục bộ 127.0.0.1:8987).
 *
 * Luồng: FE gọi init*Sign → nhận sourceUrl (văn bản cần ký) + uploadHandler
 * (nơi tool VGCA tự tải văn bản đã ký lên) → FE gọi vgca_sign_approved/issued
 * trỏ vào 2 URL đó → tool VGCA thực hiện tải + ký + tải lên trực tiếp, không
 * qua trình duyệt → hệ thống nhận file đã ký tại complete*Sign, hoàn tất
 * chuyển trạng thái đơn (tái dùng LeaveApprovalService).
 *
 * Token một-lần lưu ở Redis (TTL 15 phút) vì tool VGCA gọi thẳng vào backend,
 * không mang theo JWT — bảo mật bằng token ngẫu nhiên thay vì JWT.
 */
/**
 * TẠM ẨN — chờ hoàn tất đăng ký/xác thực quyền sử dụng dịch vụ ký số VGCA
 * (Ban Cơ yếu Chính phủ) trước khi bật lại. Bật bằng app.vgca.enabled=true
 * (biến môi trường VGCA_ENABLED) sau khi đã đăng ký xong.
 */
@Service
@ConditionalOnProperty(prefix = "app.vgca", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class VgcaSignService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(15);
    private static final String REDIS_PREFIX = "vgca:sign:";

    private final StringRedisTemplate redis;
    private final LeaveRequestRepository leaveRepo;
    private final EmployeeRepository employeeRepo;
    private final StorageService storageService;
    private final LeavePdfService leavePdfService;
    private final LeaveApprovalService approvalService;

    @Value("${app.public-base-url}")
    private String publicBaseUrl;

    // ── Init: sinh văn bản nguồn + token, trả URL cho FE gọi vgcaplugin.js ──

    @Transactional
    public Map<String, String> initDeptSign(UUID leaveId, String approverEmail) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn không ở trạng thái chờ trưởng phòng duyệt");
        }
        Employee approver = findEmployee(approverEmail);
        Employee employee = findEmployeeById(leave.getEmployeeId());
        validateDeptScope(approver, employee);

        String sourceKey = generateDraftPdf(leave, employee);
        return startSession(leaveId, "DEPT", approverEmail, sourceKey);
    }

    @Transactional
    public Map<String, String> initHrSign(UUID leaveId, String approverEmail) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.DEPT_APPROVED) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn chưa được trưởng phòng duyệt");
        }
        if (leave.getPdfUrl() == null) {
            throw HrmException.badRequest("MISSING_DEPT_PDF",
                "Chưa có văn bản đã ký ở cấp trưởng phòng — không thể ký tiếp cấp TCCB");
        }
        String sourceKey = extractKey(leave.getPdfUrl());
        return startSession(leaveId, "HR", approverEmail, sourceKey);
    }

    private Map<String, String> startSession(UUID leaveId, String stage, String approverEmail, String sourceKey) {
        String token = UUID.randomUUID().toString().replace("-", "");
        redis.opsForValue().set(REDIS_PREFIX + token,
            leaveId + "|" + stage + "|" + approverEmail + "|" + sourceKey, TOKEN_TTL);
        return Map.of(
            "sourceUrl", publicBaseUrl + "/files/vgca-source?token=" + token,
            "uploadHandler", publicBaseUrl + "/files/vgca-upload?token=" + token
        );
    }

    // ── Serve văn bản nguồn cho tool VGCA tải về (không yêu cầu JWT) ────────

    public byte[] readSourceFile(String token) {
        Session s = lookupSession(token);
        return storageService.readBytes(s.sourceKey());
    }

    // ── Nhận văn bản đã ký từ tool VGCA, hoàn tất chuyển trạng thái đơn ─────

    @Transactional
    public Map<String, Object> completeSign(String token, MultipartFile signedFile) {
        Session s;
        try {
            s = lookupSession(token);
        } catch (Exception e) {
            return uploadResult(false, "Phiên ký đã hết hạn hoặc không hợp lệ", null, null);
        }

        try {
            String key = "documents/leave-pdf/" + s.leaveId() + "-" + s.stage().toLowerCase() + "-signed.pdf";
            storageService.uploadBytes(signedFile.getBytes(), key, "application/pdf");

            if ("DEPT".equals(s.stage())) {
                approvalService.deptApprove(s.leaveId(), s.approverEmail());
            } else {
                approvalService.hrApprove(s.leaveId(), s.approverEmail());
            }

            // Ghi đè bằng bản PDF đã ký số thật (VGCA) — thay cho PDF ảnh chữ ký
            // mà hrApprove() tự sinh (LeaveApprovalService.generatePdf).
            LeaveRequest leave = findLeave(s.leaveId());
            leave.setPdfUrl("/api/files/view?key=" + key);
            leaveRepo.save(leave);

            redis.delete(REDIS_PREFIX + token);

            String fileName = signedFile.getOriginalFilename() != null ? signedFile.getOriginalFilename() : "document.pdf";
            return uploadResult(true, "", fileName, publicBaseUrl + "/files/view?key=" + key);
        } catch (Exception e) {
            log.error("Lỗi hoàn tất ký số VGCA cho đơn {} (stage={}): {}", s.leaveId(), s.stage(), e.getMessage(), e);
            return uploadResult(false, e.getMessage(), null, null);
        }
    }

    private Map<String, Object> uploadResult(boolean status, String message, String fileName, String fileServer) {
        return Map.of(
            "Status", status,
            "Message", message == null ? "" : message,
            "FileName", fileName == null ? "" : fileName,
            "FileServer", fileServer == null ? "" : fileServer
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private record Session(UUID leaveId, String stage, String approverEmail, String sourceKey) {}

    private Session lookupSession(String token) {
        String raw = redis.opsForValue().get(REDIS_PREFIX + token);
        if (raw == null) {
            throw HrmException.badRequest("SIGN_SESSION_EXPIRED", "Phiên ký số đã hết hạn hoặc không tồn tại");
        }
        String[] parts = raw.split("\\|", 4);
        return new Session(UUID.fromString(parts[0]), parts[1], parts[2], parts[3]);
    }

    private String generateDraftPdf(LeaveRequest leave, Employee employee) {
        byte[] empSig = loadSignature(employee.getSignatureUrl());
        String deptName = employee.getDepartment() != null ? employee.getDepartment().getName() : null;
        return leavePdfService.generateAndStore(
            leave, employee.getFullName(), employee.getEmployeeCode(), deptName, employee.getPosition(),
            null, null, empSig, null, null
        );
    }

    private byte[] loadSignature(String signatureUrl) {
        if (signatureUrl == null || signatureUrl.isBlank()) return null;
        try {
            return storageService.readBytes(extractKey(signatureUrl));
        } catch (Exception e) {
            return null;
        }
    }

    private String extractKey(String fileUrl) {
        String prefix = "/api/files/view?key=";
        return fileUrl.startsWith(prefix) ? fileUrl.substring(prefix.length()) : fileUrl;
    }

    private void validateDeptScope(Employee approver, Employee employee) {
        String role = approver.getHrmRole();
        if (!"DEPT_HEAD".equals(role) && !"NURSE_MANAGER".equals(role) && !"ADMIN".equals(role)) {
            throw HrmException.badRequest("NOT_DEPT_HEAD",
                "Bạn không có quyền ký duyệt đơn nghỉ phép cấp 1 (cần role Trưởng khoa/phòng hoặc Điều dưỡng trưởng)");
        }
        if (!"ADMIN".equals(role)) {
            if (approver.getDepartment() == null || employee.getDepartment() == null
                    || !approver.getDepartment().getId().equals(employee.getDepartment().getId())) {
                throw HrmException.badRequest("WRONG_DEPARTMENT", "Bạn chỉ có thể duyệt đơn của nhân viên trong phòng ban của mình");
            }
        }
    }

    private LeaveRequest findLeave(UUID id) {
        return leaveRepo.findById(id)
            .orElseThrow(() -> HrmException.notFound("LEAVE_NOT_FOUND", "Không tìm thấy đơn nghỉ phép: " + id));
    }

    private Employee findEmployee(String email) {
        return employeeRepo.findByEmail(email)
            .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + email));
    }

    private Employee findEmployeeById(UUID id) {
        return employeeRepo.findById(id)
            .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + id));
    }
}
