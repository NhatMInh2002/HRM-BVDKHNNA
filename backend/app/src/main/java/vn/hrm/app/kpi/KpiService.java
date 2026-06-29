package vn.hrm.app.kpi;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final JdbcTemplate jdbc;

    // ── Periods ────────────────────────────────────────────────────
    public List<Map<String, Object>> listPeriods() {
        return jdbc.queryForList("""
            SELECT p.id, p.name, p.period_type, p.start_date, p.end_date, p.status,
                   COUNT(DISTINCT g.employee_id) AS employee_count,
                   COUNT(g.id) AS goal_count
            FROM personnel.kpi_periods p
            LEFT JOIN personnel.kpi_goals g ON g.period_id = p.id
            GROUP BY p.id ORDER BY p.start_date DESC
            """);
    }

    @Transactional
    public Map<String, Object> createPeriod(Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO personnel.kpi_periods (id, name, period_type, start_date, end_date, status)
            VALUES (?::uuid, ?, ?, ?::date, ?::date, ?)
            """, id, str(body.get("name")), str(body.get("periodType")),
            str(body.get("startDate")), str(body.get("endDate")),
            str(body.getOrDefault("status", "OPEN")));
        return Map.of("id", id);
    }

    // ── Goals ──────────────────────────────────────────────────────
    public List<Map<String, Object>> listGoals(String periodId, String employeeId) {
        String sql = """
            SELECT g.id, g.title, g.description, g.category, g.weight,
                   g.target_value, g.target_unit, g.actual_value, g.score, g.status,
                   e.full_name, e.employee_code, d.name AS department_name
            FROM personnel.kpi_goals g
            JOIN personnel.employees e ON e.id = g.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE g.period_id = ?::uuid
            """;
        List<Object> params = new ArrayList<>();
        params.add(periodId);
        if (employeeId != null && !employeeId.isBlank()) {
            sql += " AND g.employee_id = ?::uuid";
            params.add(employeeId);
        }
        sql += " ORDER BY g.category, g.weight DESC";
        return jdbc.queryForList(sql, params.toArray());
    }

    @Transactional
    public Map<String, Object> createGoal(Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO personnel.kpi_goals
              (id, period_id, employee_id, title, description, category, weight, target_value, target_unit)
            VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?)
            """, id,
            str(body.get("periodId")), str(body.get("employeeId")),
            str(body.get("title")), str(body.get("description")),
            str(body.getOrDefault("category", "WORK")),
            body.get("weight") != null ? new BigDecimal(str(body.get("weight"))) : BigDecimal.valueOf(100),
            body.get("targetValue") != null ? new BigDecimal(str(body.get("targetValue"))) : null,
            str(body.get("targetUnit")));
        return Map.of("id", id);
    }

    @Transactional
    public void updateGoalScore(String goalId, Map<String, Object> body) {
        jdbc.update("""
            UPDATE personnel.kpi_goals
            SET actual_value = ?, score = ?, status = ?, updated_at = NOW()
            WHERE id = ?::uuid
            """,
            body.get("actualValue") != null ? new BigDecimal(str(body.get("actualValue"))) : null,
            body.get("score")       != null ? new BigDecimal(str(body.get("score"))) : null,
            str(body.getOrDefault("status", "ACTIVE")),
            goalId);
    }

    // ── Evaluations ────────────────────────────────────────────────
    public List<Map<String, Object>> listEvaluations(String periodId) {
        return jdbc.queryForList("""
            SELECT ev.id, ev.employee_id, e.full_name, e.employee_code,
                   d.name AS department_name, ev.total_score, ev.rating,
                   ev.status, ev.submitted_at, ev.approved_at
            FROM personnel.kpi_evaluations ev
            JOIN personnel.employees e ON e.id = ev.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE ev.period_id = ?::uuid
            ORDER BY d.name, e.full_name
            """, periodId);
    }

    public Map<String, Object> getEvaluation(String periodId, String employeeId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT ev.*, e.full_name, e.employee_code, d.name AS department_name
            FROM personnel.kpi_evaluations ev
            JOIN personnel.employees e ON e.id = ev.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE ev.period_id = ?::uuid AND ev.employee_id = ?::uuid
            """, periodId, employeeId);
        if (rows.isEmpty()) return null;
        Map<String, Object> ev = new HashMap<>(rows.get(0));
        // Gắn goals
        ev.put("goals", listGoals(periodId, employeeId));
        return ev;
    }

    @Transactional
    public Map<String, Object> upsertEvaluation(String periodId, String employeeId, Map<String, Object> body) {
        List<Map<String, Object>> existing = jdbc.queryForList("""
            SELECT id FROM personnel.kpi_evaluations
            WHERE period_id = ?::uuid AND employee_id = ?::uuid
            """, periodId, employeeId);

        String id;
        if (existing.isEmpty()) {
            id = UUID.randomUUID().toString();
            jdbc.update("""
                INSERT INTO personnel.kpi_evaluations (id, period_id, employee_id, status)
                VALUES (?::uuid, ?::uuid, ?::uuid, 'SELF_REVIEW')
                """, id, periodId, employeeId);
        } else {
            id = str(existing.get(0).get("id"));
        }

        // Tính tổng điểm từ goals
        List<Map<String, Object>> goals = listGoals(periodId, employeeId);
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (Map<String, Object> g : goals) {
            if (g.get("score") != null && g.get("weight") != null) {
                BigDecimal w = new BigDecimal(str(g.get("weight")));
                BigDecimal s = new BigDecimal(str(g.get("score")));
                totalScore = totalScore.add(s.multiply(w));
                totalWeight = totalWeight.add(w);
            }
        }
        BigDecimal finalScore = totalWeight.compareTo(BigDecimal.ZERO) > 0
            ? totalScore.divide(totalWeight, 2, java.math.RoundingMode.HALF_UP)
            : null;

        String rating = computeRating(finalScore);
        String status = str(body.getOrDefault("status", "SELF_REVIEW"));

        jdbc.update("""
            UPDATE personnel.kpi_evaluations
            SET self_review = ?, manager_review = ?, strengths = ?, improvements = ?,
                total_score = ?, rating = ?, status = ?,
                submitted_at = CASE WHEN ? = 'SUBMITTED' THEN NOW() ELSE submitted_at END,
                approved_at  = CASE WHEN ? = 'APPROVED'  THEN NOW() ELSE approved_at  END
            WHERE id = ?::uuid
            """,
            str(body.get("selfReview")), str(body.get("managerReview")),
            str(body.get("strengths")), str(body.get("improvements")),
            finalScore, rating, status, status, status, id);

        return Map.of("id", id, "totalScore", finalScore != null ? finalScore : BigDecimal.ZERO, "rating", rating != null ? rating : "");
    }

    // ── Stats ──────────────────────────────────────────────────────
    public Map<String, Object> stats(String periodId) {
        if (periodId == null || periodId.isBlank()) {
            List<Map<String, Object>> periods = listPeriods();
            if (!periods.isEmpty()) periodId = str(periods.get(0).get("id"));
        }
        if (periodId == null) return Map.of();

        Map<String, Object> result = new HashMap<>();
        result.put("period", periodId);
        result.put("evaluations", jdbc.queryForMap("""
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'APPROVED')    AS approved,
              COUNT(*) FILTER (WHERE status = 'SUBMITTED')   AS submitted,
              COUNT(*) FILTER (WHERE status = 'SELF_REVIEW') AS in_review,
              AVG(total_score)                               AS avg_score
            FROM personnel.kpi_evaluations WHERE period_id = ?::uuid
            """, periodId));
        result.put("ratingDist", jdbc.queryForList("""
            SELECT rating, COUNT(*) AS count
            FROM personnel.kpi_evaluations
            WHERE period_id = ?::uuid AND rating IS NOT NULL
            GROUP BY rating ORDER BY rating
            """, periodId));
        return result;
    }

    private String computeRating(BigDecimal score) {
        if (score == null) return null;
        double s = score.doubleValue();
        if (s >= 90) return "EXCELLENT";
        if (s >= 75) return "GOOD";
        if (s >= 60) return "AVERAGE";
        return "BELOW";
    }

    private static String str(Object v) { return v == null ? null : v.toString(); }
}
