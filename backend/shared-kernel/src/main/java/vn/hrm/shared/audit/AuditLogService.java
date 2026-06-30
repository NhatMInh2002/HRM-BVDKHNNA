package vn.hrm.shared.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ghi audit log bất biến (NĐ 13/2023, TT 12/2022).
 * Bảng audit.audit_log bị chặn UPDATE/DELETE ở mức DB (trigger + revoke).
 * REQUIRES_NEW để audit log luôn được ghi dù transaction nghiệp vụ rollback.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditEntry entry) {
        try {
            jdbc.update("""
                INSERT INTO audit.audit_log
                  (actor_id, actor_name, actor_role, action, entity_type, entity_id,
                   before_data, after_data, ip_address, user_agent)
                VALUES (?::uuid, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?)
                """,
                entry.actorId(), entry.actorName(), entry.actorRole(),
                entry.action(), entry.entityType(), entry.entityId(),
                toJson(entry.beforeData()), toJson(entry.afterData()),
                entry.ipAddress(), entry.userAgent());
        } catch (Exception e) {
            // Audit ghi lỗi không được làm fail nghiệp vụ chính, nhưng phải log để theo dõi
            org.slf4j.LoggerFactory.getLogger(AuditLogService.class)
                .error("Audit log write failed for {} {}", entry.entityType(), entry.entityId(), e);
        }
    }

    public void record(String actorId, String actorName, String actorRole, String action,
                        String entityType, String entityId, Object before, Object after) {
        record(new AuditEntry(actorId, actorName, actorRole, action, entityType, entityId,
            before, after, null, null));
    }

    private String toJson(Object o) {
        if (o == null) return null;
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            return null;
        }
    }

    public record AuditEntry(
        String actorId, String actorName, String actorRole,
        String action, String entityType, String entityId,
        Object beforeData, Object afterData,
        String ipAddress, String userAgent
    ) {}
}
