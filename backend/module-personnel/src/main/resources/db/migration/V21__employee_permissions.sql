-- V21: Fine-grained permission system
-- Thay thế single hrmRole bằng danh sách quyền chi tiết per employee

CREATE TABLE IF NOT EXISTS personnel.employee_permissions (
    employee_id UUID        NOT NULL REFERENCES personnel.employees(id) ON DELETE CASCADE,
    permission  VARCHAR(60) NOT NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by  VARCHAR(100),
    PRIMARY KEY (employee_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_emp_perms_employee ON personnel.employee_permissions(employee_id);

-- Seed: chuyển hrmRole hiện tại sang permissions tương đương
-- ADMIN → tất cả quyền
INSERT INTO personnel.employee_permissions (employee_id, permission, granted_by)
SELECT id, p.permission, 'system-migration'
FROM personnel.employees, (VALUES
    ('SYSTEM_ADMIN'),('SYSTEM_PERMISSION'),
    ('PERSONNEL_VIEW'),('PERSONNEL_EDIT'),('PERSONNEL_EXPORT'),
    ('ATTENDANCE_VIEW'),('ATTENDANCE_MANAGE'),
    ('LEAVE_APPROVE_DEPT'),('LEAVE_APPROVE_HR'),
    ('PAYROLL_VIEW'),('PAYROLL_MANAGE'),('PAYROLL_EXPORT')
) AS p(permission)
WHERE hrm_role = 'ADMIN'
ON CONFLICT DO NOTHING;

-- HR_MANAGER → nhân sự + chấm công + duyệt cấp 2 + lương
INSERT INTO personnel.employee_permissions (employee_id, permission, granted_by)
SELECT id, p.permission, 'system-migration'
FROM personnel.employees, (VALUES
    ('PERSONNEL_VIEW'),('PERSONNEL_EDIT'),('PERSONNEL_EXPORT'),
    ('ATTENDANCE_VIEW'),('ATTENDANCE_MANAGE'),
    ('LEAVE_APPROVE_HR'),
    ('PAYROLL_VIEW'),('PAYROLL_MANAGE'),('PAYROLL_EXPORT')
) AS p(permission)
WHERE hrm_role = 'HR_MANAGER'
ON CONFLICT DO NOTHING;

-- DEPT_HEAD → duyệt cấp 1 + xem nhân sự + chấm công trong phòng
INSERT INTO personnel.employee_permissions (employee_id, permission, granted_by)
SELECT id, p.permission, 'system-migration'
FROM personnel.employees, (VALUES
    ('PERSONNEL_VIEW'),
    ('ATTENDANCE_VIEW'),
    ('LEAVE_APPROVE_DEPT')
) AS p(permission)
WHERE hrm_role = 'DEPT_HEAD'
ON CONFLICT DO NOTHING;

-- ACCOUNTANT → xem + xuất lương
INSERT INTO personnel.employee_permissions (employee_id, permission, granted_by)
SELECT id, p.permission, 'system-migration'
FROM personnel.employees, (VALUES
    ('PAYROLL_VIEW'),('PAYROLL_EXPORT')
) AS p(permission)
WHERE hrm_role = 'ACCOUNTANT'
ON CONFLICT DO NOTHING;
