package vn.hrm.app.notification;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    String type,
    String title,
    String body,
    String link,
    boolean isRead,
    UUID referenceId,
    OffsetDateTime createdAt
) {
    static NotificationDto from(Notification n) {
        return new NotificationDto(
            n.getId(), n.getType(), n.getTitle(), n.getBody(),
            n.getLink(), n.isRead(), n.getReferenceId(), n.getCreatedAt()
        );
    }
}
