package vn.hrm.app.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-log")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final JdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "100") int limit) {

        StringBuilder sql = new StringBuilder("""
            SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id,
                   before_data, after_data, ip_address, user_agent, created_at
            FROM audit.audit_log WHERE 1=1
            """);
        List<Object> params = new ArrayList<>();
        if (entityType != null && !entityType.isBlank()) {
            sql.append(" AND entity_type = ?");
            params.add(entityType);
        }
        if (entityId != null && !entityId.isBlank()) {
            sql.append(" AND entity_id = ?");
            params.add(entityId);
        }
        if (action != null && !action.isBlank()) {
            sql.append(" AND action = ?");
            params.add(action);
        }
        sql.append(" ORDER BY created_at DESC LIMIT ?");
        params.add(Math.min(limit, 500));

        return ResponseEntity.ok(ApiResponse.ok(jdbc.queryForList(sql.toString(), params.toArray())));
    }

    @GetMapping("/entity-types")
    public ResponseEntity<?> entityTypes() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT DISTINCT entity_type FROM audit.audit_log ORDER BY entity_type");
        return ResponseEntity.ok(ApiResponse.ok(rows.stream().map(r -> r.get("entity_type")).toList()));
    }
}
