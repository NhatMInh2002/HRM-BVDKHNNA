-- ============================================================
-- V31: Điền người đứng đầu (manager_id) cho khoa/phòng
-- Nguồn: nhân viên ACTIVE trong chính khoa/phòng đó, theo thứ tự ưu tiên:
--   1. Chính danh: Trưởng khoa / Trưởng phòng / Kế toán trưởng-Trưởng phòng /
--      (Quyền) Giám đốc trung tâm
--   2. Điều hành lâm thời: Phó ... phụ trách điều hành / Phụ trách khoa
-- Chỉ điền chỗ đang trống (manager_id IS NULL) — không ghi đè lựa chọn tay,
-- chạy lại nhiều lần an toàn.
-- ============================================================

-- 1. Người đứng đầu chính danh
UPDATE personnel.departments d
SET manager_id = (
    SELECT e.id
    FROM personnel.employees e
    WHERE e.department_id = d.id
      AND e.status = 'ACTIVE'
      AND (e.position LIKE 'Trưởng khoa%'
        OR e.position LIKE 'Trưởng phòng%'
        OR e.position LIKE 'Kế toán trưởng, Trưởng phòng%'
        OR e.position LIKE 'Giám đốc trung tâm%'
        OR e.position LIKE 'Quyền Giám đốc trung tâm%')
    ORDER BY e.join_date NULLS LAST, e.full_name
    LIMIT 1
)
WHERE d.manager_id IS NULL
  AND EXISTS (
    SELECT 1 FROM personnel.employees e
    WHERE e.department_id = d.id
      AND e.status = 'ACTIVE'
      AND (e.position LIKE 'Trưởng khoa%'
        OR e.position LIKE 'Trưởng phòng%'
        OR e.position LIKE 'Kế toán trưởng, Trưởng phòng%'
        OR e.position LIKE 'Giám đốc trung tâm%'
        OR e.position LIKE 'Quyền Giám đốc trung tâm%')
  );

-- 2. Điều hành lâm thời — cho khoa/phòng chưa có trưởng chính danh
UPDATE personnel.departments d
SET manager_id = (
    SELECT e.id
    FROM personnel.employees e
    WHERE e.department_id = d.id
      AND e.status = 'ACTIVE'
      AND (e.position ILIKE '%phụ trách điều hành%' OR e.position = 'Phụ trách khoa')
    ORDER BY e.join_date NULLS LAST, e.full_name
    LIMIT 1
)
WHERE d.manager_id IS NULL
  AND EXISTS (
    SELECT 1 FROM personnel.employees e
    WHERE e.department_id = d.id
      AND e.status = 'ACTIVE'
      AND (e.position ILIKE '%phụ trách điều hành%' OR e.position = 'Phụ trách khoa')
  );
