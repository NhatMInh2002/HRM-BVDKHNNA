package vn.hrm.app.leave;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.app.storage.StorageService;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.dto.LeaveRequestResponse;
import vn.hrm.attendance.repository.LeaveRequestRepository;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.audit.AuditLogService;
import vn.hrm.shared.exception.HrmException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Xử lý luồng duyệt 2 cấp: Trưởng phòng → TCCB.
 * Nằm trong module app để truy cập cả attendance và personnel repo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaveApprovalService {

    private final LeaveRequestRepository leaveRepo;
    private final EmployeeRepository employeeRepo;
    private final StorageService storageService;
    private final LeavePdfService leavePdfService;
    private final AuditLogService auditLog;

    /** Trưởng phòng duyệt — chuyển PENDING → DEPT_APPROVED */
    public LeaveRequestResponse deptApprove(UUID leaveId, String approverEmail) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn không ở trạng thái chờ trưởng phòng duyệt");
        }

        // Kiểm tra người duyệt là trưởng phòng của đúng phòng
        Employee approver = findEmployee(approverEmail);
        Employee employee = findEmployeeById(leave.getEmployeeId());
        validateDeptHead(approver, employee);

        leave.setStatus(LeaveStatus.DEPT_APPROVED);
        leave.setDeptApprovedBy(approverEmail);
        leave.setDeptApprovedAt(OffsetDateTime.now());
        leaveRepo.save(leave);

        // Sinh PDF với chữ ký trưởng phòng đặt đúng vị trí ngay khi duyệt —
        // trước đây PDF chỉ được sinh ở bước TCCB, trưởng phòng không thấy được
        // chữ ký của mình đã đặt vào văn bản lúc duyệt.
        try {
            generatePdf(leave, approverEmail, null);
        } catch (Exception e) {
            log.error("Lỗi sinh PDF cho đơn {}: {}", leaveId, e.getMessage());
        }

        LeaveRequestResponse result = toResponse(leaveRepo.findById(leaveId).orElseThrow());
        auditLog.record(null, approverEmail, approver.getHrmRole(), "APPROVE", "LEAVE_REQUEST", leaveId.toString(),
            Map.of("status", "PENDING"), Map.of("status", "DEPT_APPROVED"));
        return result;
    }

    /** Trưởng phòng từ chối — PENDING → REJECTED */
    public LeaveRequestResponse deptReject(UUID leaveId, String approverEmail, String note) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn không ở trạng thái chờ trưởng phòng duyệt");
        }
        Employee approver = findEmployee(approverEmail);
        Employee employee = findEmployeeById(leave.getEmployeeId());
        validateDeptHead(approver, employee);

        leave.setStatus(LeaveStatus.REJECTED);
        leave.setDeptRejectedBy(approverEmail);
        leave.setDeptRejectedAt(OffsetDateTime.now());
        leave.setDeptRejectNote(note);

        LeaveRequestResponse result = toResponse(leaveRepo.save(leave));
        auditLog.record(null, approverEmail, approver.getHrmRole(), "REJECT", "LEAVE_REQUEST", leaveId.toString(),
            Map.of("status", "PENDING"), Map.of("status", "REJECTED", "note", note == null ? "" : note));
        return result;
    }

    /** TCCB (HR_MANAGER) duyệt — DEPT_APPROVED → APPROVED + sinh PDF */
    public LeaveRequestResponse hrApprove(UUID leaveId, String approverEmail) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.DEPT_APPROVED) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn chưa được trưởng phòng duyệt");
        }

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setHrApprovedBy(approverEmail);
        leave.setHrApprovedAt(OffsetDateTime.now());
        // Legacy field
        leave.setApprovedBy(approverEmail);
        leave.setApprovedAt(OffsetDateTime.now());

        leaveRepo.save(leave);

        // Sinh lại PDF, bổ sung chữ ký TCCB vào văn bản đã có chữ ký trưởng phòng
        try {
            generatePdf(leave, leave.getDeptApprovedBy(), approverEmail);
        } catch (Exception e) {
            log.error("Lỗi sinh PDF cho đơn {}: {}", leaveId, e.getMessage());
            // Không throw — PDF lỗi không chặn việc duyệt
        }

        auditLog.record(null, approverEmail, "HR_MANAGER", "APPROVE", "LEAVE_REQUEST", leaveId.toString(),
            Map.of("status", "DEPT_APPROVED"), Map.of("status", "APPROVED"));
        return toResponse(leaveRepo.findById(leaveId).orElseThrow());
    }

    /** TCCB từ chối — DEPT_APPROVED → REJECTED */
    public LeaveRequestResponse hrReject(UUID leaveId, String approverEmail, String note) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.DEPT_APPROVED) {
            throw HrmException.badRequest("INVALID_STATUS", "Đơn chưa được trưởng phòng duyệt");
        }

        leave.setStatus(LeaveStatus.REJECTED);
        leave.setHrRejectedBy(approverEmail);
        leave.setHrRejectedAt(OffsetDateTime.now());
        leave.setHrRejectNote(note);

        LeaveRequestResponse result = toResponse(leaveRepo.save(leave));
        auditLog.record(null, approverEmail, "HR_MANAGER", "REJECT", "LEAVE_REQUEST", leaveId.toString(),
            Map.of("status", "DEPT_APPROVED"), Map.of("status", "REJECTED", "note", note == null ? "" : note));
        return result;
    }

    /** Lấy đơn đang chờ trưởng phòng (theo phòng ban) */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getPendingForDeptHead(String deptHeadEmail) {
        Employee head = findEmployee(deptHeadEmail);
        // ADMIN duyệt được mọi phòng ban (khớp validateDeptHead) — không giới hạn
        // theo department của chính tài khoản ADMIN (thường không gán phòng ban).
        if ("ADMIN".equals(head.getHrmRole())) {
            return leaveRepo.findByStatusOrderByCreatedAtDesc(LeaveStatus.PENDING)
                    .stream().map(this::toResponse).toList();
        }
        if (head.getDepartment() == null) return List.of();
        List<UUID> empIds = employeeRepo.findIdsByDepartmentId(head.getDepartment().getId());
        if (empIds.isEmpty()) return List.of();
        return leaveRepo.findByEmployeeIdInAndStatusOrderByCreatedAtDesc(empIds, LeaveStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    /** Lấy đơn đang chờ TCCB duyệt (tất cả phòng ban) */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getPendingForHr() {
        return leaveRepo.findByStatusOrderByCreatedAtDesc(LeaveStatus.DEPT_APPROVED)
                .stream().map(this::toResponse).toList();
    }

    // ── Private helpers ───────────────────────────────────────────────

    /**
     * Sinh (hoặc sinh lại) PDF đơn nghỉ phép, đặt chữ ký vào đúng vị trí của
     * từng cấp đã duyệt. Gọi lại ở mỗi cấp duyệt (deptApprove, hrApprove) —
     * không chỉ ở bước cuối — để mỗi người duyệt thấy chữ ký của mình đã được
     * đặt vào văn bản ngay khi họ duyệt, thay vì chỉ xuất hiện sau cùng.
     *
     * @param deptHeadEmail email trưởng phòng đã duyệt, null nếu chưa tới cấp này
     * @param hrEmail       email TCCB đã duyệt, null nếu chưa tới cấp này
     */
    private void generatePdf(LeaveRequest leave, String deptHeadEmail, String hrEmail) {
        Employee employee = findEmployeeById(leave.getEmployeeId());
        byte[] empSig = loadSignature(employee.getSignatureUrl());
        String deptName = employee.getDepartment() != null ? employee.getDepartment().getName() : null;

        String deptHeadName = null;
        byte[] deptSig = null;
        if (deptHeadEmail != null) {
            try {
                Employee deptHead = findEmployee(deptHeadEmail);
                deptHeadName = deptHead.getFullName();
                deptSig = loadSignature(deptHead.getSignatureUrl());
            } catch (Exception ignored) {}
        }

        String hrName = null;
        byte[] hrSig = null;
        if (hrEmail != null) {
            try {
                Employee hrOfficer = findEmployee(hrEmail);
                hrName = hrOfficer.getFullName();
                hrSig = loadSignature(hrOfficer.getSignatureUrl());
            } catch (Exception ignored) {}
        }

        String pdfKey = leavePdfService.generateAndStore(
            leave,
            employee.getFullName(),
            employee.getEmployeeCode(),
            deptName,
            employee.getPosition(),
            deptHeadName,
            hrName,
            empSig,
            deptSig,
            hrSig
        );

        leave.setPdfUrl("/api/files/view?key=" + pdfKey);
        leaveRepo.save(leave);
    }

    private byte[] loadSignature(String signatureUrl) {
        if (signatureUrl == null || signatureUrl.isBlank()) return null;
        try {
            String key = signatureUrl;
            if (key.startsWith("/api/files/view?key=")) {
                key = key.substring("/api/files/view?key=".length());
            }
            return storageService.readBytes(key);
        } catch (Exception e) {
            log.warn("Không thể tải chữ ký: {}", e.getMessage());
            return null;
        }
    }

    private void validateDeptHead(Employee approver, Employee employee) {
        String role = approver.getHrmRole();
        // Duyệt cấp 1: trưởng khoa/phòng (DEPT_HEAD) hoặc điều dưỡng trưởng (NURSE_MANAGER)
        if (!"DEPT_HEAD".equals(role) && !"NURSE_MANAGER".equals(role) && !"ADMIN".equals(role)) {
            throw HrmException.badRequest("NOT_DEPT_HEAD", "Bạn không có quyền duyệt đơn nghỉ phép cấp 1 (cần role Trưởng khoa/phòng hoặc Điều dưỡng trưởng)");
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

    private LeaveRequestResponse toResponse(LeaveRequest r) {
        Employee emp = null;
        try { emp = findEmployeeById(r.getEmployeeId()); } catch (Exception ignored) {}
        return LeaveRequestResponse.from(r,
            emp != null ? emp.getFullName() : null,
            emp != null ? emp.getEmployeeCode() : null);
    }
}
