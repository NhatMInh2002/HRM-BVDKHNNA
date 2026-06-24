-- Thêm cột keycloak_username để link nhân viên với tài khoản SSO
ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS keycloak_username VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_employees_keycloak_username
    ON personnel.employees (keycloak_username);

-- Gán keycloak_username cho tài khoản test đã có
UPDATE personnel.employees SET keycloak_username = 'admin.hrm'   WHERE employee_code = 'NV001';
UPDATE personnel.employees SET keycloak_username = 'hr.manager'  WHERE employee_code = 'NV002';
UPDATE personnel.employees SET keycloak_username = 'dept.mgr.01' WHERE employee_code = 'NV003';
UPDATE personnel.employees SET keycloak_username = 'accountant'  WHERE employee_code = 'NV004';
