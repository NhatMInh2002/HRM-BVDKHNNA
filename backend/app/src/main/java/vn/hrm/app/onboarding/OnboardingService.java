package vn.hrm.app.onboarding;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final JdbcTemplate jdbc;

    // ── Templates ──────────────────────────────────────────────────
    public List<Map<String, Object>> listTemplates() {
        return jdbc.queryForList("""
            SELECT t.id, t.name, t.description, t.is_active,
                   COUNT(tt.id) AS task_count
            FROM personnel.onboarding_templates t
            LEFT JOIN personnel.onboarding_template_tasks tt ON tt.template_id = t.id
            WHERE t.is_active = TRUE
            GROUP BY t.id ORDER BY t.name
            """);
    }

    public List<Map<String, Object>> listTemplateTasks(String templateId) {
        return jdbc.queryForList("""
            SELECT id, title, description, category, due_days, sort_order, is_required
            FROM personnel.onboarding_template_tasks
            WHERE template_id = ?::uuid
            ORDER BY sort_order
            """, templateId);
    }

    // ── Checklists ─────────────────────────────────────────────────
    public List<Map<String, Object>> listChecklists(String employeeId) {
        String sql = """
            SELECT c.id, c.employee_id, e.full_name, e.employee_code,
                   c.start_date, c.status,
                   COUNT(t.id) AS total_tasks,
                   COUNT(t.id) FILTER (WHERE t.status = 'DONE') AS done_tasks
            FROM personnel.onboarding_checklists c
            JOIN personnel.employees e ON e.id = c.employee_id
            LEFT JOIN personnel.onboarding_tasks t ON t.checklist_id = c.id
            """;
        List<Object> params = new ArrayList<>();
        if (employeeId != null && !employeeId.isBlank()) {
            sql += " WHERE c.employee_id = ?::uuid";
            params.add(employeeId);
        }
        sql += " GROUP BY c.id, e.full_name, e.employee_code ORDER BY c.created_at DESC LIMIT 100";
        return jdbc.queryForList(sql, params.toArray());
    }

    public Map<String, Object> getChecklist(String checklistId) {
        Map<String, Object> checklist = jdbc.queryForMap("""
            SELECT c.id, c.employee_id, e.full_name, e.employee_code,
                   d.name AS department_name, c.start_date, c.status, c.created_at
            FROM personnel.onboarding_checklists c
            JOIN personnel.employees e ON e.id = c.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE c.id = ?::uuid
            """, checklistId);
        List<Map<String, Object>> tasks = jdbc.queryForList("""
            SELECT id, title, description, category, due_date, status,
                   completed_at, notes, sort_order, is_required
            FROM personnel.onboarding_tasks
            WHERE checklist_id = ?::uuid
            ORDER BY sort_order
            """, checklistId);
        checklist.put("tasks", tasks);
        return checklist;
    }

    @Transactional
    public Map<String, Object> createChecklist(Map<String, Object> body) {
        String employeeId  = str(body.get("employeeId"));
        String templateId  = str(body.get("templateId"));
        String startDateStr = str(body.get("startDate"));
        LocalDate startDate = startDateStr != null && !startDateStr.isBlank()
            ? LocalDate.parse(startDateStr) : LocalDate.now();

        String checklistId = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO personnel.onboarding_checklists (id, employee_id, template_id, start_date)
            VALUES (?::uuid, ?::uuid, ?::uuid, ?)
            """, checklistId, employeeId, templateId, startDate);

        // Copy tasks từ template
        if (templateId != null && !templateId.isBlank()) {
            List<Map<String, Object>> tmplTasks = listTemplateTasks(templateId);
            for (Map<String, Object> t : tmplTasks) {
                int dueDays = intVal(t.get("due_days"), 3);
                jdbc.update("""
                    INSERT INTO personnel.onboarding_tasks
                      (checklist_id, title, description, category, due_date, sort_order, is_required)
                    VALUES (?::uuid, ?, ?, ?, ?, ?, ?)
                    """,
                    checklistId, str(t.get("title")), str(t.get("description")),
                    str(t.get("category")), startDate.plusDays(dueDays),
                    intVal(t.get("sort_order"), 0), Boolean.TRUE.equals(t.get("is_required")));
            }
        }
        return Map.of("id", checklistId);
    }

    @Transactional
    public void updateTaskStatus(String taskId, String status, String notes, String completedBy) {
        if ("DONE".equals(status)) {
            jdbc.update("""
                UPDATE personnel.onboarding_tasks
                SET status = ?, completed_at = NOW(), completed_by = ?::uuid, notes = ?
                WHERE id = ?::uuid
                """, status, completedBy, notes, taskId);
        } else {
            jdbc.update("""
                UPDATE personnel.onboarding_tasks
                SET status = ?, completed_at = NULL, notes = ?
                WHERE id = ?::uuid
                """, status, notes, taskId);
        }
        // Cập nhật trạng thái checklist
        jdbc.update("""
            UPDATE personnel.onboarding_checklists c
            SET status = CASE
                WHEN NOT EXISTS (SELECT 1 FROM personnel.onboarding_tasks t
                                 WHERE t.checklist_id = c.id AND t.status != 'DONE' AND t.is_required)
                THEN 'COMPLETED' ELSE 'IN_PROGRESS' END
            WHERE c.id = (SELECT checklist_id FROM personnel.onboarding_tasks WHERE id = ?::uuid)
            """, taskId);
    }

    // ── Stats ──────────────────────────────────────────────────────
    public Map<String, Object> stats() {
        return jdbc.queryForMap("""
            SELECT
              COUNT(*) AS total_checklists,
              COUNT(*) FILTER (WHERE status = 'COMPLETED')   AS completed,
              COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress,
              (SELECT COUNT(*) FROM personnel.onboarding_tasks WHERE status = 'PENDING'
               AND due_date < CURRENT_DATE) AS overdue_tasks
            FROM personnel.onboarding_checklists
            """);
    }

    private static String str(Object v) { return v == null ? null : v.toString(); }
    private static int intVal(Object v, int def) {
        if (v == null) return def;
        try { return ((Number) v).intValue(); } catch (Exception e) { return def; }
    }
}
