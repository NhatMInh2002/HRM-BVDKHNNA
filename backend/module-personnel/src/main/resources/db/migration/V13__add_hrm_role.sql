-- V13: Thêm cột hrm_role để lưu vai trò hệ thống (cache từ Keycloak)
ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS hrm_role VARCHAR(50) DEFAULT 'EMPLOYEE';

-- Gán role cho tài khoản test đã biết
UPDATE personnel.employees SET hrm_role = 'ADMIN'              WHERE employee_code = 'NV001';
UPDATE personnel.employees SET hrm_role = 'HR_MANAGER'         WHERE employee_code = 'NV002';
UPDATE personnel.employees SET hrm_role = 'DEPARTMENT_MANAGER' WHERE employee_code = 'NV003';
UPDATE personnel.employees SET hrm_role = 'ACCOUNTANT'         WHERE employee_code = 'NV004';
