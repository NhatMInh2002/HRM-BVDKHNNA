package vn.hrm.app.leave;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.attendance.dto.LeaveRequestResponse;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/attendance/leave")
@RequiredArgsConstructor
public class LeaveApprovalController {

    private final LeaveApprovalService approvalService;

    /** Trưởng phòng: lấy đơn chờ duyệt của phòng mình */
    @GetMapping("/dept-pending")
    @PreAuthorize("hasAnyRole('DEPT_HEAD','NURSE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getDeptPending(Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingForDeptHead(email)));
    }

    /** TCCB: lấy đơn chờ duyệt cấp 2 */
    @GetMapping("/hr-pending")
    @PreAuthorize("hasAnyRole('HR_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getHrPending() {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingForHr()));
    }

    /** Trưởng phòng duyệt */
    @PostMapping("/{id}/dept-approve")
    @PreAuthorize("hasAnyRole('DEPT_HEAD','NURSE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> deptApprove(
            @PathVariable UUID id, Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(approvalService.deptApprove(id, email)));
    }

    /** Trưởng phòng từ chối */
    @PostMapping("/{id}/dept-reject")
    @PreAuthorize("hasAnyRole('DEPT_HEAD','NURSE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> deptReject(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest body,
            Authentication auth) {
        String email = (String) auth.getPrincipal();
        String note = body != null ? body.note() : null;
        return ResponseEntity.ok(ApiResponse.ok(approvalService.deptReject(id, email, note)));
    }

    /** TCCB duyệt (sinh PDF) */
    @PostMapping("/{id}/hr-approve")
    @PreAuthorize("hasAnyRole('HR_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> hrApprove(
            @PathVariable UUID id, Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(approvalService.hrApprove(id, email)));
    }

    /** TCCB từ chối */
    @PostMapping("/{id}/hr-reject")
    @PreAuthorize("hasAnyRole('HR_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> hrReject(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest body,
            Authentication auth) {
        String email = (String) auth.getPrincipal();
        String note = body != null ? body.note() : null;
        return ResponseEntity.ok(ApiResponse.ok(approvalService.hrReject(id, email, note)));
    }

    record RejectRequest(String note) {}
}
