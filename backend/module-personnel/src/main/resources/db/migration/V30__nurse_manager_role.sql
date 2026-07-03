-- ============================================================
-- V30: Role Điều dưỡng trưởng (NURSE_MANAGER)
-- Điều dưỡng trưởng / Nữ hộ sinh trưởng là người duyệt nghỉ phép
-- cấp 1 cho điều dưỡng trong khoa mình (song song với Trưởng khoa/phòng).
-- Role được suy ra từ quyền LEAVE_APPROVE_NURSE (xem PermissionController.deriveRole).
-- ============================================================

-- 1. Cấp quyền cho các Điều dưỡng trưởng / Nữ hộ sinh trưởng hiện có
INSERT INTO personnel.employee_permissions (employee_id, permission, granted_by)
SELECT e.id, p.permission, 'system-migration'
FROM personnel.employees e, (VALUES
    ('PERSONNEL_VIEW'),
    ('ATTENDANCE_VIEW'),
    ('LEAVE_APPROVE_NURSE')
) AS p(permission)
WHERE (e.position ILIKE '%điều dưỡng trưởng%' OR e.position ILIKE '%nữ hộ sinh trưởng%')
ON CONFLICT DO NOTHING;

-- 2. Cập nhật hrm_role — chỉ nâng cấp từ EMPLOYEE, không ghi đè role cao hơn
UPDATE personnel.employees
SET hrm_role = 'NURSE_MANAGER'
WHERE (position ILIKE '%điều dưỡng trưởng%' OR position ILIKE '%nữ hộ sinh trưởng%')
  AND (hrm_role IS NULL OR hrm_role = 'EMPLOYEE');
