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
import vn.hrm.shared.exception.HrmException;

import java.time.OffsetDateTime;
import java.util.List;
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

        return toResponse(leaveRepo.save(leave));
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

        return toResponse(leaveRepo.save(leave));
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

        // Sinh PDF async (không chặn response)
        try {
            generatePdf(leave, approverEmail);
        } catch (Exception e) {
            log.error("Lỗi sinh PDF cho đơn {}: {}", leaveId, e.getMessage());
            // Không throw — PDF lỗi không chặn việc duyệt
        }

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

        return toResponse(leaveRepo.save(leave));
    }

    /** Lấy đơn đang chờ trưởng phòng (theo phòng ban) */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getPendingForDeptHead(String deptHeadEmail) {
        Employee head = findEmployee(deptHeadEmail);
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

    private void generatePdf(LeaveRequest leave, String hrEmail) {
        Employee employee   = findEmployeeById(leave.getEmployeeId());
        Employee hrOfficer  = findEmployee(hrEmail);

        // Tìm trưởng phòng đã duyệt (từ field deptApprovedBy)
        String deptHeadName = leave.getDeptApprovedBy();
        byte[] deptSig = null;
        if (deptHeadName != null) {
            try {
                Employee deptHead = findEmployee(deptHeadName);
                deptHeadName = deptHead.getFullName();
                deptSig = loadSignature(deptHead.getSignatureUrl());
            } catch (Exception ignored) {}
        }

        byte[] empSig = loadSignature(employee.getSignatureUrl());
        byte[] hrSig  = loadSignature(hrOfficer.getSignatureUrl());

        String deptName = employee.getDepartment() != null ? employee.getDepartment().getName() : null;

        String pdfKey = leavePdfService.generateAndStore(
            leave,
            employee.getFullName(),
            employee.getEmployeeCode(),
            deptName,
            employee.getPosition(),
            deptHeadName,
            hrOfficer.getFullName(),
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
        if (!"DEPT_HEAD".equals(approver.getHrmRole()) && !"ADMIN".equals(approver.getHrmRole())) {
            throw HrmException.badRequest("NOT_DEPT_HEAD", "Bạn không có quyền duyệt đơn nghỉ phép (cần role DEPT_HEAD)");
        }
        if (!"ADMIN".equals(approver.getHrmRole())) {
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
