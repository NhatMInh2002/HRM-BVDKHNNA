package vn.hrm.app.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;
    private final AttendanceReminderScheduler reminderScheduler;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(Authentication auth) {
        UUID empId = resolveEmployeeId(auth);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getMyNotifications(empId)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication auth) {
        UUID empId = resolveEmployeeId(auth);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount(empId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable UUID id, Authentication auth) {
        UUID empId = resolveEmployeeId(auth);
        notificationService.markRead(id, empId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Authentication auth) {
        UUID empId = resolveEmployeeId(auth);
        notificationService.markAllRead(empId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/admin/trigger-checkin-reminder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> triggerCheckIn() {
        reminderScheduler.triggerCheckInReminder();
        return ResponseEntity.ok(ApiResponse.ok("Đã gửi nhắc check-in đến toàn bộ nhân viên"));
    }

    @PostMapping("/admin/trigger-checkout-reminder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> triggerCheckOut() {
        reminderScheduler.triggerCheckOutReminder();
        return ResponseEntity.ok(ApiResponse.ok("Đã gửi nhắc check-out đến toàn bộ nhân viên"));
    }

    private UUID resolveEmployeeId(Authentication auth) {
        String email = (String) auth.getPrincipal();
        return employeeRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + email))
            .getId();
    }
}
