package vn.hrm.app.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Nhắc nhở chấm công: 7:45 check-in, 15:45 check-out — chỉ T2-T6.
 *
 * Ngoài cron chạy đúng giờ, còn CHẠY BÙ khi backend khởi động: nếu hôm nay là ngày
 * làm việc, đã qua giờ nhắc mà chưa gửi (vì backend bị restart/redeploy vắt qua khung
 * giờ đó), thì gửi bù ngay. Tránh tình trạng job buổi sáng bị bỏ lỡ vĩnh viễn khi
 * container không tình cờ sống đúng khoảnh khắc 7:45:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceReminderScheduler {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalTime CHECKIN_TIME  = LocalTime.of(7, 45);
    private static final LocalTime CHECKOUT_TIME = LocalTime.of(15, 45);

    private static final String CHECKIN_TITLE  = "Nhắc chấm công vào";
    private static final String CHECKOUT_TITLE = "Nhắc chấm công ra";
    private static final String CHECKIN_BODY   = "Đã 7:45 — đừng quên check-in trước 8:00 để không bị tính đi muộn.";
    private static final String CHECKOUT_BODY  = "Đã 15:45 — nhớ check-out trước khi kết thúc ca làm việc.";
    private static final String ATTENDANCE_LINK = "/dashboard/attendance";

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    /** 7:45 T2-T6 — nhắc check-in */
    @Scheduled(cron = "0 45 7 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void remindCheckIn() {
        sendOnce(CHECKIN_TITLE, CHECKIN_BODY);
    }

    /** 15:45 T2-T6 — nhắc check-out */
    @Scheduled(cron = "0 45 15 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void remindCheckOut() {
        sendOnce(CHECKOUT_TITLE, CHECKOUT_BODY);
    }

    /**
     * Chạy bù khi backend khởi động — bù các job đã trôi qua trong ngày làm việc hôm nay
     * mà chưa gửi (do container không sống đúng thời điểm cron).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void catchUpMissedReminders() {
        ZonedDateTime now = ZonedDateTime.now(VN_ZONE);
        DayOfWeek dow = now.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return;

        LocalTime nowTime = now.toLocalTime();
        if (nowTime.isAfter(CHECKIN_TIME)) {
            if (sendOnce(CHECKIN_TITLE, CHECKIN_BODY)) {
                log.info("Đã gửi bù thông báo '{}' khi khởi động (bị lỡ khung giờ cron)", CHECKIN_TITLE);
            }
        }
        if (nowTime.isAfter(CHECKOUT_TIME)) {
            if (sendOnce(CHECKOUT_TITLE, CHECKOUT_BODY)) {
                log.info("Đã gửi bù thông báo '{}' khi khởi động (bị lỡ khung giờ cron)", CHECKOUT_TITLE);
            }
        }
    }

    /** Test endpoint — admin trigger thủ công (bỏ qua guard chống trùng) */
    public void triggerCheckInReminder()  { sendToAll(CHECKIN_TITLE, CHECKIN_BODY); }
    public void triggerCheckOutReminder() { sendToAll(CHECKOUT_TITLE, CHECKOUT_BODY); }

    /**
     * Gửi thông báo nếu HÔM NAY chưa gửi thông báo cùng tiêu đề.
     * @return true nếu thực sự đã gửi, false nếu bỏ qua vì đã gửi rồi.
     */
    private boolean sendOnce(String title, String body) {
        ZonedDateTime startOfDay = ZonedDateTime.now(VN_ZONE).toLocalDate().atStartOfDay(VN_ZONE);
        OffsetDateTime from = startOfDay.toOffsetDateTime();
        OffsetDateTime to   = startOfDay.plusDays(1).toOffsetDateTime();

        long already = notificationRepository.countByTitleAndCreatedAtBetween(title, from, to);
        if (already > 0) {
            log.debug("Bỏ qua '{}' — đã gửi {} thông báo hôm nay", title, already);
            return false;
        }
        sendToAll(title, body);
        return true;
    }

    private void sendToAll(String title, String body) {
        try {
            List<Employee> employees = employeeRepository.findAll();
            for (Employee emp : employees) {
                notificationService.create(emp.getId(), "SYSTEM", title, body, ATTENDANCE_LINK, null);
            }
            log.info("Đã gửi thông báo '{}' tới {} nhân viên", title, employees.size());
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo nhắc chấm công: {}", title, e);
        }
    }
}
