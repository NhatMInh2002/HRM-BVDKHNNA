package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 10 báo cáo Excel chấm công cho Phòng TCCB.
 * Mỗi báo cáo một sheet, header 3 dòng theo phong cách bảng biểu hành chính
 * (tên bệnh viện — tên báo cáo — kỳ báo cáo).
 *
 * Quy ước giờ hành chính: vào 08:00, ra 17:00 (Asia/Ho_Chi_Minh) — cùng
 * ngưỡng với ReportService.attendanceSummary.
 */
@Service
@RequiredArgsConstructor
public class AttendanceExcelService {

    private static final String TZ = "Asia/Ho_Chi_Minh";
    private static final String HOSPITAL = "BỆNH VIỆN HỮU NGHỊ ĐA KHOA NGHỆ AN";

    private final JdbcTemplate jdbc;

    // ── 1+2. Bảng chấm công tháng (toàn viện / theo khoa phòng) — mẫu 01a-LĐTL ──

    /**
     * Ma trận nhân viên × ngày trong tháng. Ký hiệu: x = đủ công, M = đi muộn,
     * 1/2 = nửa công, P = nghỉ phép, V = vắng, trống = không có dữ liệu.
     * @param departmentId null = toàn viện
     */
    public byte[] monthlyGrid(int year, int month, UUID departmentId) throws Exception {
        YearMonth ym = YearMonth.of(year, month);
        int days = ym.lengthOfMonth();

        String deptFilter = departmentId != null ? " AND e.department_id = ? " : "";
        Object[] args = departmentId != null
                ? new Object[]{year, month, departmentId}
                : new Object[]{year, month};

        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.id, e.employee_code, e.full_name, d.name AS dept_name,
                   ar.work_date, ar.status,
                   EXTRACT(HOUR   FROM ar.check_in AT TIME ZONE '%s') AS ci_h,
                   EXTRACT(MINUTE FROM ar.check_in AT TIME ZONE '%s') AS ci_m
            FROM personnel.employees e
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            LEFT JOIN attendance.attendance_records ar
                ON ar.employee_id = e.id
                AND EXTRACT(YEAR FROM ar.work_date) = ? AND EXTRACT(MONTH FROM ar.work_date) = ?
            WHERE e.status IN ('ACTIVE','PROBATION') %s
            ORDER BY d.name NULLS LAST, e.full_name, ar.work_date
            """.formatted(TZ, TZ, deptFilter), args);

        try (var wb = new XSSFWorkbook(); var bos = new ByteArrayOutputStream()) {
            Styles st = new Styles(wb);
            Sheet sheet = wb.createSheet("Cham cong " + month + "-" + year);

            String scope = departmentId != null && !rows.isEmpty()
                    ? String.valueOf(rows.get(0).get("dept_name")) : "Toàn viện";
            int headerCols = 4 + days + 3;
            writeTitle(sheet, st, "BẢNG CHẤM CÔNG THÁNG " + month + "/" + year + " — " + scope
                    + " (theo mẫu 01a-LĐTL)", headerCols);

            Row h = sheet.createRow(3);
            String[] fixed = {"STT", "Mã NV", "Họ tên", "Khoa/Phòng"};
            for (int i = 0; i < fixed.length; i++) cell(h, i, fixed[i], st.header);
            for (int d = 1; d <= days; d++) cell(h, 3 + d, String.valueOf(d), st.header);
            cell(h, 4 + days, "Công", st.header);
            cell(h, 5 + days, "Phép", st.header);
            cell(h, 6 + days, "Vắng", st.header);

            // gom theo nhân viên
            var byEmp = new java.util.LinkedHashMap<Object, Map<String, Object>>();
            var marks = new java.util.HashMap<Object, String[]>();
            for (Map<String, Object> r : rows) {
                Object id = r.get("id");
                byEmp.putIfAbsent(id, r);
                String[] m = marks.computeIfAbsent(id, k -> new String[days + 1]);
                Object wd = r.get("work_date");
                if (wd == null) continue;
                int day = ((java.sql.Date) wd).toLocalDate().getDayOfMonth();
                m[day] = symbol(String.valueOf(r.get("status")), r.get("ci_h"), r.get("ci_m"));
            }

            int rowIdx = 4, stt = 1;
            for (var e : byEmp.entrySet()) {
                Map<String, Object> emp = e.getValue();
                String[] m = marks.get(e.getKey());
                Row row = sheet.createRow(rowIdx++);
                cell(row, 0, String.valueOf(stt++), st.body);
                cell(row, 1, str(emp.get("employee_code")), st.body);
                cell(row, 2, str(emp.get("full_name")), st.body);
                cell(row, 3, str(emp.get("dept_name")), st.body);
                int cong = 0, phep = 0, vang = 0;
                for (int d = 1; d <= days; d++) {
                    String sym = m[d] == null ? "" : m[d];
                    cell(row, 3 + d, sym, st.center);
                    switch (sym) {
                        case "x", "M" -> cong++;
                        case "1/2" -> cong++; // nửa công vẫn đếm buổi có mặt
                        case "P" -> phep++;
                        case "V" -> vang++;
                        default -> {}
                    }
                }
                numCell(row, 4 + days, cong, st.body);
                numCell(row, 5 + days, phep, st.body);
                numCell(row, 6 + days, vang, st.body);
            }

            legend(sheet, rowIdx + 1, st,
                    "Ký hiệu: x = đủ công · M = đi muộn · 1/2 = nửa công · P = nghỉ phép · V = vắng");
            sizeColumns(sheet, 4, days);
            wb.write(bos);
            return bos.toByteArray();
        }
    }

    // ── 3. Đi muộn / về sớm ──────────────────────────────────────────────────

    public byte[] lateEarly(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name, ar.work_date,
                   TO_CHAR(ar.check_in  AT TIME ZONE '%s', 'HH24:MI') AS gio_vao,
                   TO_CHAR(ar.check_out AT TIME ZONE '%s', 'HH24:MI') AS gio_ra,
                   GREATEST(0, EXTRACT(EPOCH FROM (ar.check_in AT TIME ZONE '%s')::time - TIME '08:00')/60)::INT AS phut_muon,
                   CASE WHEN ar.check_out IS NULL THEN 0
                        ELSE GREATEST(0, EXTRACT(EPOCH FROM TIME '17:00' - (ar.check_out AT TIME ZONE '%s')::time)/60)::INT
                   END AS phut_som
            FROM attendance.attendance_records ar
            JOIN personnel.employees e ON e.id = ar.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE EXTRACT(YEAR FROM ar.work_date) = ? AND EXTRACT(MONTH FROM ar.work_date) = ?
              AND ar.check_in IS NOT NULL
              AND ((ar.check_in AT TIME ZONE '%s')::time > TIME '08:00'
                   OR (ar.check_out IS NOT NULL AND (ar.check_out AT TIME ZONE '%s')::time < TIME '17:00'))
            ORDER BY ar.work_date, d.name, e.full_name
            """.formatted(TZ, TZ, TZ, TZ, TZ, TZ), year, month);

        return simpleReport("Di muon ve som", "BÁO CÁO ĐI MUỘN / VỀ SỚM THÁNG " + month + "/" + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Ngày", "Giờ vào", "Giờ ra", "Phút muộn", "Phút về sớm"},
                rows, r -> new Object[]{
                        r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                        str(r.get("work_date")), r.get("gio_vao"), r.get("gio_ra"),
                        r.get("phut_muon"), r.get("phut_som")});
    }

    // ── 4. Vắng không phép ───────────────────────────────────────────────────

    public byte[] unexcusedAbsence(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name, ar.work_date, ar.note
            FROM attendance.attendance_records ar
            JOIN personnel.employees e ON e.id = ar.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE EXTRACT(YEAR FROM ar.work_date) = ? AND EXTRACT(MONTH FROM ar.work_date) = ?
              AND ar.status = 'ABSENT'
              AND NOT EXISTS (
                  SELECT 1 FROM attendance.leave_requests lr
                  WHERE lr.employee_id = ar.employee_id AND lr.status = 'APPROVED'
                    AND ar.work_date BETWEEN lr.start_date AND lr.end_date)
            ORDER BY ar.work_date, d.name, e.full_name
            """, year, month);

        return simpleReport("Vang khong phep", "BÁO CÁO VẮNG MẶT KHÔNG PHÉP THÁNG " + month + "/" + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Ngày vắng", "Ghi chú"},
                rows, r -> new Object[]{
                        r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                        str(r.get("work_date")), r.get("note")});
    }

    // ── 5. Tăng ca (OT) ──────────────────────────────────────────────────────

    public byte[] overtime(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name,
                   COUNT(*) AS so_ngay_ot,
                   ROUND(SUM(EXTRACT(EPOCH FROM (ar.check_out - ar.check_in))/3600 - 8)::NUMERIC, 2) AS tong_gio_ot
            FROM attendance.attendance_records ar
            JOIN personnel.employees e ON e.id = ar.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE EXTRACT(YEAR FROM ar.work_date) = ? AND EXTRACT(MONTH FROM ar.work_date) = ?
              AND ar.check_out IS NOT NULL
              AND EXTRACT(EPOCH FROM (ar.check_out - ar.check_in))/3600 > 8
            GROUP BY e.employee_code, e.full_name, d.name
            ORDER BY tong_gio_ot DESC
            """, year, month);

        return simpleReport("Tang ca", "BÁO CÁO LÀM THÊM GIỜ (OT) THÁNG " + month + "/" + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Số ngày có OT", "Tổng giờ OT"},
                rows, r -> new Object[]{
                        r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                        r.get("so_ngay_ot"), r.get("tong_gio_ot")});
    }

    // ── 6. Nghỉ phép đã duyệt theo loại ─────────────────────────────────────

    public byte[] leaveByType(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name,
                   lr.leave_type, lr.start_date, lr.end_date, lr.total_days,
                   lr.hr_approved_by, lr.reason
            FROM attendance.leave_requests lr
            JOIN personnel.employees e ON e.id = lr.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE lr.status = 'APPROVED'
              AND EXTRACT(YEAR FROM lr.start_date) = ? AND EXTRACT(MONTH FROM lr.start_date) = ?
            ORDER BY lr.leave_type, lr.start_date, e.full_name
            """, year, month);

        return simpleReport("Nghi phep theo loai", "BÁO CÁO NGHỈ PHÉP ĐÃ DUYỆT THÁNG " + month + "/" + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Loại phép", "Từ ngày", "Đến ngày", "Số ngày", "TCCB duyệt", "Lý do"},
                rows, r -> new Object[]{
                        r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                        r.get("leave_type"), str(r.get("start_date")), str(r.get("end_date")),
                        r.get("total_days"), r.get("hr_approved_by"), r.get("reason")});
    }

    // ── 7. Số dư phép năm ────────────────────────────────────────────────────

    public byte[] leaveBalance(int year) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name,
                   EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date))::INT AS tham_nien,
                   CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 15 THEN 18
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 10 THEN 16
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date)) >= 5  THEN 14
                        ELSE 12 END AS tieu_chuan,
                   COALESCE((SELECT SUM(lr.total_days) FROM attendance.leave_requests lr
                             WHERE lr.employee_id = e.id AND lr.status = 'APPROVED'
                               AND lr.leave_type = 'ANNUAL'
                               AND EXTRACT(YEAR FROM lr.start_date) = ?), 0) AS da_dung
            FROM personnel.employees e
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE e.status = 'ACTIVE'
            ORDER BY d.name, e.full_name
            """, year);

        return simpleReport("So du phep " + year, "BẢNG SỐ DƯ PHÉP NĂM " + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Thâm niên (năm)", "Tiêu chuẩn", "Đã dùng", "Còn lại"},
                rows, r -> {
                    double tieuChuan = ((Number) r.get("tieu_chuan")).doubleValue();
                    double daDung = ((Number) r.get("da_dung")).doubleValue();
                    return new Object[]{
                            r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                            r.get("tham_nien"), tieuChuan, daDung, tieuChuan - daDung};
                });
    }

    // ── 8. Đối soát ngày công – bảng lương ───────────────────────────────────

    public byte[] payrollReconciliation(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.employee_code, e.full_name, d.name AS dept_name,
                   pr.working_days, pr.actual_days,
                   COALESCE(att.days_present, 0) AS cham_cong,
                   COALESCE(att.days_present, 0) - pr.actual_days AS chenh_lech,
                   pr.status
            FROM payroll.payroll_records pr
            JOIN personnel.employees e ON e.id = pr.employee_id
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            LEFT JOIN (
                SELECT employee_id, COUNT(*) AS days_present
                FROM attendance.attendance_records
                WHERE EXTRACT(YEAR FROM work_date) = ? AND EXTRACT(MONTH FROM work_date) = ?
                  AND status IN ('PRESENT','LATE')
                GROUP BY employee_id
            ) att ON att.employee_id = pr.employee_id
            WHERE pr.period_year = ? AND pr.period_month = ?
            ORDER BY ABS(COALESCE(att.days_present, 0) - pr.actual_days) DESC, e.full_name
            """, year, month, year, month);

        return simpleReport("Doi soat cong-luong", "ĐỐI SOÁT NGÀY CÔNG CHẤM CÔNG ↔ BẢNG LƯƠNG THÁNG " + month + "/" + year,
                new String[]{"STT", "Mã NV", "Họ tên", "Khoa/Phòng", "Công chuẩn", "Công tính lương", "Công chấm thực", "Chênh lệch", "Trạng thái lương"},
                rows, r -> new Object[]{
                        r.get("employee_code"), r.get("full_name"), r.get("dept_name"),
                        r.get("working_days"), r.get("actual_days"), r.get("cham_cong"),
                        r.get("chenh_lech"), r.get("status")});
    }

    // ── 9. So sánh chuyên cần giữa khoa/phòng ────────────────────────────────

    public byte[] deptComparison(int year, int month) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT d.name AS dept_name, d.code AS dept_code,
                   COUNT(DISTINCT e.id) AS so_nv,
                   COUNT(ar.id) AS luot_cham_cong,
                   COUNT(ar.id) FILTER (WHERE ar.status = 'LATE'
                       OR (ar.check_in IS NOT NULL AND (ar.check_in AT TIME ZONE '%s')::time > TIME '08:00')) AS luot_muon,
                   COUNT(ar.id) FILTER (WHERE ar.status = 'ABSENT') AS luot_vang,
                   ROUND(COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT','LATE'))::NUMERIC
                         / NULLIF(COUNT(DISTINCT e.id), 0), 1) AS cong_binh_quan
            FROM personnel.departments d
            LEFT JOIN personnel.employees e ON e.department_id = d.id AND e.status = 'ACTIVE'
            LEFT JOIN attendance.attendance_records ar ON ar.employee_id = e.id
                AND EXTRACT(YEAR FROM ar.work_date) = ? AND EXTRACT(MONTH FROM ar.work_date) = ?
            WHERE d.parent_id IS NOT NULL
            GROUP BY d.id, d.name, d.code
            HAVING COUNT(DISTINCT e.id) > 0
            ORDER BY cong_binh_quan DESC NULLS LAST
            """.formatted(TZ), year, month);

        return simpleReport("So sanh khoa phong", "SO SÁNH CHUYÊN CẦN GIỮA KHOA/PHÒNG THÁNG " + month + "/" + year,
                new String[]{"STT", "Khoa/Phòng", "Mã", "Số NV", "Lượt chấm công", "Lượt đi muộn", "Lượt vắng", "Công BQ/người"},
                rows, r -> new Object[]{
                        r.get("dept_name"), r.get("dept_code"), r.get("so_nv"),
                        r.get("luot_cham_cong"), r.get("luot_muon"), r.get("luot_vang"),
                        r.get("cong_binh_quan")});
    }

    // ── 10. Chi tiết 1 nhân viên theo khoảng thời gian ───────────────────────

    public byte[] employeeDetail(UUID employeeId, LocalDate from, LocalDate to) throws Exception {
        Map<String, Object> emp = jdbc.queryForMap(
                "SELECT employee_code, full_name FROM personnel.employees WHERE id = ?", employeeId);

        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT ar.work_date, ar.status,
                   TO_CHAR(ar.check_in  AT TIME ZONE '%s', 'HH24:MI') AS gio_vao,
                   TO_CHAR(ar.check_out AT TIME ZONE '%s', 'HH24:MI') AS gio_ra,
                   CASE WHEN ar.check_out IS NOT NULL
                        THEN ROUND((EXTRACT(EPOCH FROM (ar.check_out - ar.check_in))/3600)::NUMERIC, 2) END AS so_gio,
                   ar.note
            FROM attendance.attendance_records ar
            WHERE ar.employee_id = ? AND ar.work_date BETWEEN ? AND ?
            ORDER BY ar.work_date
            """.formatted(TZ, TZ), employeeId, from, to);

        return simpleReport("Chi tiet cham cong",
                "CHI TIẾT CHẤM CÔNG: " + str(emp.get("full_name")) + " (" + str(emp.get("employee_code"))
                        + ") — TỪ " + from + " ĐẾN " + to,
                new String[]{"STT", "Ngày", "Trạng thái", "Giờ vào", "Giờ ra", "Số giờ", "Ghi chú"},
                rows, r -> new Object[]{
                        str(r.get("work_date")), r.get("status"), r.get("gio_vao"),
                        r.get("gio_ra"), r.get("so_gio"), r.get("note")});
    }

    // ── Khung dựng sheet dùng chung ──────────────────────────────────────────

    private interface RowMapperFn { Object[] map(Map<String, Object> row); }

    private byte[] simpleReport(String sheetName, String title, String[] headers,
                                List<Map<String, Object>> rows, RowMapperFn fn) throws Exception {
        try (var wb = new XSSFWorkbook(); var bos = new ByteArrayOutputStream()) {
            Styles st = new Styles(wb);
            Sheet sheet = wb.createSheet(sheetName);
            writeTitle(sheet, st, title, headers.length);

            Row h = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) cell(h, i, headers[i], st.header);

            int rowIdx = 4, stt = 1;
            for (Map<String, Object> r : rows) {
                Row row = sheet.createRow(rowIdx++);
                cell(row, 0, String.valueOf(stt++), st.body);
                Object[] vals = fn.map(r);
                for (int i = 0; i < vals.length; i++) {
                    Object v = vals[i];
                    if (v instanceof Number n) numCell(row, i + 1, n.doubleValue(), st.body);
                    else cell(row, i + 1, str(v), st.body);
                }
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(bos);
            return bos.toByteArray();
        }
    }

    private void writeTitle(Sheet sheet, Styles st, String title, int cols) {
        int span = Math.max(1, Math.min(cols, 20));
        Row r0 = sheet.createRow(0);
        cell(r0, 0, HOSPITAL, st.hospital);
        Row r1 = sheet.createRow(1);
        cell(r1, 0, title, st.title);
        if (span > 1) {
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, span - 1));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, span - 1));
        }
        sheet.createRow(2); // dòng trống ngăn cách
    }

    private void legend(Sheet sheet, int rowIdx, Styles st, String text) {
        Row r = sheet.createRow(rowIdx);
        cell(r, 0, text, st.italic);
    }

    private String symbol(String status, Object ciHour, Object ciMin) {
        return switch (status) {
            case "PRESENT" -> isLate(ciHour, ciMin) ? "M" : "x";
            case "LATE" -> "M";
            case "HALF_DAY" -> "1/2";
            case "LEAVE" -> "P";
            case "ABSENT" -> "V";
            default -> "";
        };
    }

    private boolean isLate(Object hour, Object min) {
        if (hour == null) return false;
        int h = ((Number) hour).intValue();
        int m = min != null ? ((Number) min).intValue() : 0;
        return h > 8 || (h == 8 && m > 0);
    }

    private void sizeColumns(Sheet sheet, int fixedCols, int dayCols) {
        for (int i = 0; i < fixedCols; i++) sheet.autoSizeColumn(i);
        for (int d = 1; d <= dayCols; d++) sheet.setColumnWidth(fixedCols - 1 + d, 4 * 256);
        for (int i = fixedCols + dayCols; i < fixedCols + dayCols + 3; i++) sheet.autoSizeColumn(i);
    }

    private void cell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private void numCell(Row row, int col, double value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    private String str(Object v) { return v != null ? String.valueOf(v) : ""; }

    /** Bộ style dùng chung cho một workbook. */
    private static final class Styles {
        final CellStyle hospital, title, header, body, center, italic;

        Styles(Workbook wb) {
            org.apache.poi.ss.usermodel.Font bold = wb.createFont();
            bold.setBold(true);
            org.apache.poi.ss.usermodel.Font boldBig = wb.createFont();
            boldBig.setBold(true); boldBig.setFontHeightInPoints((short) 13);
            org.apache.poi.ss.usermodel.Font it = wb.createFont();
            it.setItalic(true);

            hospital = wb.createCellStyle();
            hospital.setFont(bold);
            hospital.setAlignment(HorizontalAlignment.CENTER);

            title = wb.createCellStyle();
            title.setFont(boldBig);
            title.setAlignment(HorizontalAlignment.CENTER);

            header = wb.createCellStyle();
            header.setFont(bold);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setBorderBottom(BorderStyle.THIN);
            header.setBorderTop(BorderStyle.THIN);
            header.setBorderLeft(BorderStyle.THIN);
            header.setBorderRight(BorderStyle.THIN);
            header.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            body = wb.createCellStyle();
            body.setBorderBottom(BorderStyle.THIN);
            body.setBorderLeft(BorderStyle.THIN);
            body.setBorderRight(BorderStyle.THIN);

            center = wb.createCellStyle();
            center.cloneStyleFrom(body);
            center.setAlignment(HorizontalAlignment.CENTER);

            italic = wb.createCellStyle();
            italic.setFont(it);
        }
    }
}
