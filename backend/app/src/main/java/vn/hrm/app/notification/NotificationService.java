package vn.hrm.app.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository repo;

    public List<NotificationDto> getMyNotifications(UUID recipientId) {
        return repo.findByRecipientIdOrderByCreatedAtDesc(recipientId)
            .stream().limit(50)
            .map(NotificationDto::from)
            .toList();
    }

    public Map<String, Long> getUnreadCount(UUID recipientId) {
        return Map.of("unread", repo.countByRecipientIdAndIsReadFalse(recipientId));
    }

    @Transactional
    public void markRead(UUID notificationId, UUID recipientId) {
        repo.markAsRead(notificationId, recipientId);
    }

    @Transactional
    public void markAllRead(UUID recipientId) {
        repo.markAllAsRead(recipientId);
    }

    @Transactional
    public Notification create(UUID recipientId, String type, String title, String body, String link, UUID referenceId) {
        return repo.save(Notification.builder()
            .recipientId(recipientId)
            .type(type)
            .title(title)
            .body(body)
            .link(link)
            .referenceId(referenceId)
            .isRead(false)
            .build());
    }
}
