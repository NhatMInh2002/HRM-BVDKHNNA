package vn.hrm.app.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.event.CheckedInEvent;
import vn.hrm.shared.event.LeaveStatusChangedEvent;
import vn.hrm.shared.event.LeaveSubmittedEvent;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> LEAVE_LABELS = Map.ofEntries(
        Map.entry("ANNUAL",                  "Nghỉ phép năm"),
        Map.entry("PERSONAL_MARRIAGE",       "Nghỉ kết hôn"),
        Map.entry("PERSONAL_CHILD_MARRIAGE", "Nghỉ con kết hôn"),
        Map.entry("BEREAVEMENT_LEVEL1",      "Nghỉ tang"),
        Map.entry("BEREAVEMENT_LEVEL2",      "Nghỉ tang"),
        Map.entry("SICK",                    "Nghỉ ốm"),
        Map.entry("MATERNITY",               "Nghỉ thai sản"),
        Map.entry("PATERNITY",               "Nghỉ con"),
        Map.entry("COMPENSATORY",            "Nghỉ bù"),
        Map.entry("UNPAID",                  "Nghỉ không lương"),
        Map.entry("OTHER",                   "Nghỉ khác")
    );

    @Async
    @EventListener
    public void onLeaveSubmitted(LeaveSubmittedEvent event) {
        try {
            Employee employee = employeeRepository.findById(event.employeeId()).orElse(null);
            String empName = employee != null ? employee.getFullName() : "Nhân viên";
            String leaveLabel = LEAVE_LABELS.getOrDefault(event.leaveType(), "Nghỉ phép");

            String title = "Đơn nghỉ phép mới cần duyệt";
            String body = String.format("%s xin %s từ %s đến %s (%d ngày)",
                empName, leaveLabel,
                event.startDate().format(DATE_FMT),
                event.endDate().format(DATE_FMT),
                event.totalDays()
            );

            // Thông báo cho HR_MANAGER và ADMIN
            List<Employee> managers = employeeRepository.findByHrmRoleIn(List.of("HR_MANAGER", "ADMIN"));
            for (Employee mgr : managers) {
                notificationService.create(mgr.getId(), "LEAVE_SUBMITTED", title, body,
                    "/dashboard/attendance/leave", event.leaveId());
            }
        } catch (Exception e) {
            log.error("Failed to create leave-submitted notification", e);
        }
    }

    @Async
    @EventListener
    public void onLeaveStatusChanged(LeaveStatusChangedEvent event) {
        try {
            String leaveLabel = LEAVE_LABELS.getOrDefault(event.leaveType(), "Nghỉ phép");
            boolean approved = "APPROVED".equals(event.newStatus());

            String title = approved ? "Đơn nghỉ phép được duyệt" : "Đơn nghỉ phép bị từ chối";
            String body = approved
                ? String.format("Đơn %s của bạn đã được %s duyệt", leaveLabel, event.actorName())
                : String.format("Đơn %s của bạn bị từ chối bởi %s", leaveLabel, event.actorName());

            notificationService.create(event.employeeId(),
                approved ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
                title, body, "/dashboard/attendance/leave", event.leaveId());
        } catch (Exception e) {
            log.error("Failed to create leave-status-changed notification", e);
        }
    }

    @Async
    @EventListener
    public void onCheckedIn(CheckedInEvent event) {
        try {
            String time = event.checkInTime()
                .atZoneSameInstant(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("HH:mm"));
            notificationService.create(event.employeeId(), "CHECKIN",
                "Chấm công thành công",
                "Bạn đã check-in lúc " + time,
                "/dashboard/attendance", null);
        } catch (Exception e) {
            log.error("Failed to create check-in notification", e);
        }
    }
}
