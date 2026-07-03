package vn.hrm.shared.security;

/** Danh sách mã quyền trong hệ thống HRM. */
public final class Permissions {

    private Permissions() {}

    // ── Nhân sự ───────────────────────────────────────────────────────
    public static final String PERSONNEL_VIEW   = "PERSONNEL_VIEW";
    public static final String PERSONNEL_EDIT   = "PERSONNEL_EDIT";
    public static final String PERSONNEL_EXPORT = "PERSONNEL_EXPORT";

    // ── Chấm công ─────────────────────────────────────────────────────
    public static final String ATTENDANCE_VIEW   = "ATTENDANCE_VIEW";
    public static final String ATTENDANCE_MANAGE = "ATTENDANCE_MANAGE";

    // ── Nghỉ phép ─────────────────────────────────────────────────────
    public static final String LEAVE_APPROVE_DEPT  = "LEAVE_APPROVE_DEPT";  // Trưởng khoa/phòng, cấp 1
    public static final String LEAVE_APPROVE_NURSE = "LEAVE_APPROVE_NURSE"; // Điều dưỡng trưởng, cấp 1 (điều dưỡng trong khoa)
    public static final String LEAVE_APPROVE_HR    = "LEAVE_APPROVE_HR";    // TCCB, cấp 2

    // ── Lương ─────────────────────────────────────────────────────────
    public static final String PAYROLL_VIEW   = "PAYROLL_VIEW";
    public static final String PAYROLL_MANAGE = "PAYROLL_MANAGE";
    public static final String PAYROLL_EXPORT = "PAYROLL_EXPORT";

    // ── Hệ thống ──────────────────────────────────────────────────────
    public static final String SYSTEM_ADMIN      = "SYSTEM_ADMIN";
    public static final String SYSTEM_PERMISSION = "SYSTEM_PERMISSION";
}
