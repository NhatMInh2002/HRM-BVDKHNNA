package vn.hrm.app.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.util.List;

/**
 * Nhắc nhở chấm công: 7:45 check-in, 15:45 check-out — chỉ T2-T6.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceReminderScheduler {

    private final NotificationService notificationService;
    private final EmployeeRepository  employeeRepository;

    /** 7:45 T2-T6 — nhắc check-in */
    @Scheduled(cron = "0 45 7 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void remindCheckIn() {
        sendToAll(
            "SYSTEM",
            "Nhắc chấm công vào",
            "Đã 7:45 — đừng quên check-in trước 8:00 để không bị tính đi muộn.",
            "/dashboard/attendance"
        );
    }

    /** 15:45 T2-T6 — nhắc check-out */
    @Scheduled(cron = "0 45 15 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void remindCheckOut() {
        sendToAll(
            "SYSTEM",
            "Nhắc chấm công ra",
            "Đã 15:45 — nhớ check-out trước khi kết thúc ca làm việc.",
            "/dashboard/attendance"
        );
    }

    private void sendToAll(String type, String title, String body, String link) {
        try {
            List<Employee> employees = employeeRepository.findAll();
            for (Employee emp : employees) {
                notificationService.create(emp.getId(), type, title, body, link, null);
            }
            log.info("Sent '{}' notification to {} employees", title, employees.size());
        } catch (Exception e) {
            log.error("Failed to send attendance reminder: {}", title, e);
        }
    }
}
