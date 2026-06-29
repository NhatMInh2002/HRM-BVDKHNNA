package vn.hrm.app.report;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final JdbcTemplate jdbc;

    // ── Headcount theo phòng ban ──────────────────────────────────────────────

    public List<Map<String, Object>> headcountByDept() {
        return jdbc.queryForList("""
            SELECT
                d.name                          AS dept_name,
                d.code                          AS dept_code,
                COUNT(e.id)                     AS total,
                COUNT(e.id) FILTER (WHERE e.status = 'ACTIVE')      AS active,
                COUNT(e.id) FILTER (WHERE e.status = 'PROBATION')   AS probation,
                COUNT(e.id) FILTER (WHERE e.status = 'TERMINATED')  AS terminated,
                COUNT(e.id) FILTER (WHERE e.contract_type = 'INDEFINITE') AS indefinite,
                COUNT(e.id) FILTER (WHERE e.contract_type LIKE 'FIXED%')  AS fixed_term
            FROM personnel.departments d
            LEFT JOIN personnel.employees e ON e.department_id = d.id
            WHERE d.parent_id IS NOT NULL
            GROUP BY d.id, d.name, d.code
            HAVING COUNT(e.id) > 0
            ORDER BY total DESC
        """);
    }

    // ── Chi phí lương theo phòng ban ─────────────────────────────────────────

    public List<Map<String, Object>> payrollCostByDept(int year, int month) {
        return jdbc.queryForList("""
            SELECT
                d.name                              AS dept_name,
                d.code                              AS dept_code,
                COUNT(pr.id)                        AS employee_count,
                COALESCE(SUM(pr.gross_salary), 0)   AS total_gross,
                COALESCE(SUM(pr.net_salary), 0)     AS total_net,
                COALESCE(SUM(pr.total_employer_cost), 0) AS total_employer_cost
            FROM personnel.departments d
            LEFT JOIN personnel.employees e ON e.department_id = d.id
            LEFT JOIN payroll.payroll_records pr
                ON pr.employee_id = e.id
                AND pr.period_year = ?
                AND pr.period_month = ?
            WHERE d.parent_id IS NOT NULL
            GROUP BY d.id, d.name, d.code
            HAVING COUNT(pr.id) > 0
            ORDER BY total_gross DESC
        """, year, month);
    }

    // ── Tỉ lệ chuyên cần theo phòng ban ──────────────────────────────────────

    public List<Map<String, Object>> attendanceSummary(int year, int month) {
        return jdbc.queryForList("""
            SELECT
                d.name                              AS dept_name,
                d.code                              AS dept_code,
                COUNT(DISTINCT e.id)                AS total_employees,
                COUNT(ar.id)                        AS total_records,
                ROUND(AVG(
                    CASE WHEN ar.check_in IS NOT NULL THEN 1 ELSE 0 END
                ) * 100, 1)                         AS checkin_rate_pct,
                COUNT(ar.id) FILTER (
                    WHERE ar.check_in IS NOT NULL
                    AND EXTRACT(HOUR FROM ar.check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') >= 8
                    AND (EXTRACT(MINUTE FROM ar.check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') > 0
                         OR EXTRACT(HOUR FROM ar.check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') > 8)
                )                                   AS late_count,
                COALESCE(SUM(lr.total_days), 0)     AS leave_days_used
            FROM personnel.departments d
            LEFT JOIN personnel.employees e ON e.department_id = d.id AND e.status = 'ACTIVE'
            LEFT JOIN attendance.attendance_records ar
                ON ar.employee_id = e.id
                AND EXTRACT(YEAR FROM ar.work_date) = ?
                AND EXTRACT(MONTH FROM ar.work_date) = ?
            LEFT JOIN attendance.leave_requests lr
                ON lr.employee_id = e.id
                AND lr.status = 'APPROVED'
                AND EXTRACT(YEAR FROM lr.start_date) = ?
                AND EXTRACT(MONTH FROM lr.start_date) = ?
            WHERE d.parent_id IS NOT NULL
            GROUP BY d.id, d.name, d.code
            HAVING COUNT(DISTINCT e.id) > 0
            ORDER BY dept_name
        """, year, month, year, month);
    }

    // ── Overview tổng hợp ─────────────────────────────────────────────────────

    public Map<String, Object> overview(int year, int month) {
        Map<String, Object> headcount = jdbc.queryForMap("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'ACTIVE')     AS active_employees,
                COUNT(*) FILTER (WHERE status = 'PROBATION')  AS probation_employees,
                COUNT(*) FILTER (WHERE status = 'TERMINATED') AS terminated_employees,
                COUNT(*)                                        AS total_employees
            FROM personnel.employees
        """);

        Map<String, Object> payroll = jdbc.queryForMap("""
            SELECT
                COUNT(*)                        AS payroll_count,
                COALESCE(SUM(gross_salary), 0)  AS total_gross,
                COALESCE(SUM(net_salary), 0)    AS total_net,
                COALESCE(SUM(total_employer_cost), 0) AS total_cost,
                COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_count,
                COUNT(*) FILTER (WHERE status = 'PAID')     AS paid_count
            FROM payroll.payroll_records
            WHERE period_year = ? AND period_month = ?
        """, year, month);

        Map<String, Object> attendance = jdbc.queryForMap("""
            SELECT
                COUNT(DISTINCT employee_id)     AS employees_recorded,
                COUNT(*)                        AS total_check_ins,
                COUNT(*) FILTER (
                    WHERE check_in IS NOT NULL
                    AND EXTRACT(HOUR FROM check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') >= 8
                    AND (EXTRACT(MINUTE FROM check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') > 0
                         OR EXTRACT(HOUR FROM check_in AT TIME ZONE 'Asia/Ho_Chi_Minh') > 8)
                )                               AS late_count
            FROM attendance.attendance_records
            WHERE EXTRACT(YEAR FROM work_date) = ?
              AND EXTRACT(MONTH FROM work_date) = ?
        """, year, month);

        Map<String, Object> leave = jdbc.queryForMap("""
            SELECT
                COUNT(*)                                        AS total_requests,
                COUNT(*) FILTER (WHERE status = 'PENDING')     AS pending_count,
                COUNT(*) FILTER (WHERE status = 'APPROVED')    AS approved_count,
                COALESCE(SUM(total_days) FILTER (WHERE status = 'APPROVED'), 0) AS approved_days
            FROM attendance.leave_requests
            WHERE EXTRACT(YEAR FROM start_date) = ?
              AND EXTRACT(MONTH FROM start_date) = ?
        """, year, month);

        Map<String, Object> contracts = jdbc.queryForMap("""
            SELECT
                COUNT(*) FILTER (WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 90) AS expiring_90d,
                COUNT(*) FILTER (WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS expiring_30d
            FROM personnel.contracts
            WHERE status = 'ACTIVE'
        """);

        return Map.of(
            "headcount", headcount,
            "payroll", payroll,
            "attendance", attendance,
            "leave", leave,
            "contracts", contracts,
            "period", Map.of("year", year, "month", month)
        );
    }

    // ── Số dư phép năm ───────────────────────────────────────────────────────

    public List<Map<String, Object>> leaveBalance(int year, String departmentId) {
        String deptFilter = (departmentId != null && !departmentId.isBlank())
            ? "AND e.department_id = '" + departmentId.replaceAll("[^a-zA-Z0-9\\-]", "") + "'::UUID"
            : "";

        return jdbc.queryForList("""
            SELECT
                e.employee_code,
                e.full_name,
                d.name              AS dept_name,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date))::INT AS years_of_service,
                CASE
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 15 THEN 18
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 10 THEN 16
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 5  THEN 14
                    ELSE 12
                END                 AS annual_entitlement,
                COALESCE((
                    SELECT SUM(lr.total_days)
                    FROM attendance.leave_requests lr
                    WHERE lr.employee_id = e.id
                      AND lr.status = 'APPROVED'
                      AND lr.leave_type = 'ANNUAL'
                      AND EXTRACT(YEAR FROM lr.start_date) = ?
                ), 0)               AS annual_used,
                CASE
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 15 THEN 18
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 10 THEN 16
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 5  THEN 14
                    ELSE 12
                END - COALESCE((
                    SELECT SUM(lr.total_days)
                    FROM attendance.leave_requests lr
                    WHERE lr.employee_id = e.id
                      AND lr.status = 'APPROVED'
                      AND lr.leave_type = 'ANNUAL'
                      AND EXTRACT(YEAR FROM lr.start_date) = ?
                ), 0)               AS annual_remaining
            FROM personnel.employees e
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE e.status = 'ACTIVE'
            """ + deptFilter + """
            ORDER BY d.name, e.full_name
        """, year, year);
    }
}
