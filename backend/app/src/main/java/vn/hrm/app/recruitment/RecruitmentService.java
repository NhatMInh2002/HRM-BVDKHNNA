package vn.hrm.app.recruitment;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final JdbcTemplate jdbc;

    // ── Job Postings ─────────────────────────────────────────────────────────

    public List<Map<String, Object>> listPostings(String status) {
        String statusFilter = "ALL".equalsIgnoreCase(status) ? "" : "AND jp.status = ?";
        Object[] params = "ALL".equalsIgnoreCase(status) ? new Object[]{} : new Object[]{status};
        return jdbc.queryForList("""
            SELECT jp.id, jp.title, jp.position, jp.quantity, jp.salary_range,
                   jp.deadline, jp.status, jp.created_at,
                   d.name  AS dept_name,
                   d.code  AS dept_code,
                   (SELECT COUNT(*) FROM recruitment.candidates c WHERE c.job_posting_id = jp.id) AS candidate_count,
                   (SELECT COUNT(*) FROM recruitment.candidates c WHERE c.job_posting_id = jp.id AND c.stage NOT IN ('HIRED','REJECTED')) AS active_candidates
            FROM recruitment.job_postings jp
            LEFT JOIN personnel.departments d ON d.id = jp.department_id
            WHERE 1=1 """ + statusFilter + """
            ORDER BY jp.created_at DESC
        """, params);
    }

    public Map<String, Object> getPosting(String id) {
        return jdbc.queryForMap("""
            SELECT jp.*, d.name AS dept_name
            FROM recruitment.job_postings jp
            LEFT JOIN personnel.departments d ON d.id = jp.department_id
            WHERE jp.id = ?::UUID
        """, id);
    }

    public Map<String, Object> createPosting(Map<String, Object> body, String createdBy) {
        String newId = UUID.randomUUID().toString();
        String deptId = str(body.get("departmentId"));
        jdbc.update("""
            INSERT INTO recruitment.job_postings
                (id, title, department_id, quantity, position, description, requirements, benefits, salary_range, deadline, status, created_by)
            VALUES (?::UUID, ?, ?::UUID, ?, ?, ?, ?, ?, ?, ?::DATE, ?, ?)
        """,
            newId,
            str(body.get("title")),
            deptId.isBlank() ? null : deptId,
            intVal(body.get("quantity"), 1),
            str(body.get("position")),
            str(body.get("description")),
            str(body.get("requirements")),
            str(body.get("benefits")),
            str(body.get("salaryRange")),
            str(body.get("deadline")),
            str(body.getOrDefault("status", "DRAFT")),
            createdBy
        );
        return Map.of("id", newId);
    }

    public void updatePostingStatus(String id, String status) {
        jdbc.update("UPDATE recruitment.job_postings SET status = ?, updated_at = NOW() WHERE id = ?::UUID",
                status, id);
    }

    // ── Candidates ────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listCandidates(String postingId, String stage) {
        StringBuilder sql = new StringBuilder("""
            SELECT c.id, c.full_name, c.email, c.phone, c.stage, c.source,
                   c.cv_url, c.notes, c.reject_reason, c.created_at,
                   jp.title AS posting_title,
                   (SELECT COUNT(*) FROM recruitment.interviews i WHERE i.candidate_id = c.id) AS interview_count,
                   (SELECT MAX(i.scheduled_at) FROM recruitment.interviews i WHERE i.candidate_id = c.id) AS last_interview
            FROM recruitment.candidates c
            LEFT JOIN recruitment.job_postings jp ON jp.id = c.job_posting_id
            WHERE 1=1
        """);
        java.util.List<Object> params = new java.util.ArrayList<>();
        if (postingId != null && !postingId.isBlank()) {
            sql.append(" AND c.job_posting_id = ?::UUID");
            params.add(postingId);
        }
        if (stage != null && !stage.isBlank()) {
            sql.append(" AND c.stage = ?");
            params.add(stage);
        }
        sql.append(" ORDER BY c.updated_at DESC");
        return jdbc.queryForList(sql.toString(), params.toArray());
    }

    public Map<String, Object> addCandidate(Map<String, Object> body, String createdBy) {
        String newId = UUID.randomUUID().toString();
        String postingId = str(body.get("jobPostingId"));
        jdbc.update("""
            INSERT INTO recruitment.candidates
                (id, job_posting_id, full_name, email, phone, cv_url, source, stage, notes, created_by)
            VALUES (?::UUID, ?::UUID, ?, ?, ?, ?, ?, 'NEW', ?, ?)
        """,
            newId,
            postingId.isBlank() ? null : postingId,
            str(body.get("fullName")),
            str(body.get("email")),
            str(body.get("phone")),
            str(body.get("cvUrl")),
            str(body.getOrDefault("source", "DIRECT")),
            str(body.get("notes")),
            createdBy
        );
        return Map.of("id", newId);
    }

    public void moveStage(String id, String stage, String rejectReason) {
        jdbc.update("""
            UPDATE recruitment.candidates
            SET stage = ?, reject_reason = ?, updated_at = NOW()
            WHERE id = ?::UUID
        """, stage, rejectReason, id);
    }

    // ── Interviews ────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listInterviews(String candidateId) {
        return jdbc.queryForList("""
            SELECT id, scheduled_at, interview_type, interviewer, location, result, score, notes, created_at
            FROM recruitment.interviews
            WHERE candidate_id = ?::UUID
            ORDER BY scheduled_at DESC
        """, candidateId);
    }

    public Map<String, Object> scheduleInterview(String candidateId, Map<String, Object> body, String createdBy) {
        String newId = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO recruitment.interviews
                (id, candidate_id, scheduled_at, interview_type, interviewer, location, notes, created_by)
            VALUES (?::UUID, ?::UUID, ?::TIMESTAMP, ?, ?, ?, ?, ?)
        """,
            newId, candidateId,
            str(body.get("scheduledAt")),
            str(body.getOrDefault("interviewType", "IN_PERSON")),
            str(body.get("interviewer")),
            str(body.get("location")),
            str(body.get("notes")),
            createdBy
        );
        // Tự động chuyển ứng viên sang stage INTERVIEW
        jdbc.update("""
            UPDATE recruitment.candidates
            SET stage = 'INTERVIEW', updated_at = NOW()
            WHERE id = ?::UUID AND stage IN ('NEW','SCREENING')
        """, candidateId);
        return Map.of("id", newId);
    }

    public void updateInterviewResult(String id, String result, Integer score, String notes) {
        jdbc.update("""
            UPDATE recruitment.interviews
            SET result = ?, score = ?, notes = COALESCE(?, notes)
            WHERE id = ?::UUID
        """, result, score, notes, id);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public Map<String, Object> stats() {
        Map<String, Object> postings = jdbc.queryForMap("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'OPEN')   AS open_postings,
                COUNT(*) FILTER (WHERE status = 'DRAFT')  AS draft_postings,
                COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed_postings,
                COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status = 'OPEN') AS overdue
            FROM recruitment.job_postings
        """);
        Map<String, Object> candidates = jdbc.queryForMap("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE stage = 'NEW')        AS new_count,
                COUNT(*) FILTER (WHERE stage = 'SCREENING')  AS screening,
                COUNT(*) FILTER (WHERE stage = 'INTERVIEW')  AS interview,
                COUNT(*) FILTER (WHERE stage = 'OFFER')      AS offer,
                COUNT(*) FILTER (WHERE stage = 'HIRED')      AS hired,
                COUNT(*) FILTER (WHERE stage = 'REJECTED')   AS rejected
            FROM recruitment.candidates
        """);
        return Map.of("postings", postings, "candidates", candidates);
    }

    private static String str(Object v) { return v != null ? v.toString() : ""; }
    private static int intVal(Object v, int def) {
        try { return v != null ? Integer.parseInt(v.toString()) : def; } catch (Exception e) { return def; }
    }
}
