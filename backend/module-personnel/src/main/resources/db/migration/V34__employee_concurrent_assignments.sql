-- ============================================================
-- V34: Kiêm nhiệm khoa/phòng khác — Điều 34.6, tr.53
-- Nguồn dữ liệu gốc cho hệ số kiêm nhiệm khoa/phòng khi cấu hình
-- payroll.salary_increment_configs (tránh nhập tay lại % thời gian).
-- ============================================================

CREATE TABLE IF NOT EXISTS personnel.employee_concurrent_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES personnel.employees(id),
    department_id   UUID NOT NULL REFERENCES personnel.departments(id),  -- khoa/phòng kiêm nhiệm
    role_type       VARCHAR(10) NOT NULL,   -- BS_DS (+10%) | DD_KTV (+5%)
    time_percent    NUMERIC(5,2) NOT NULL,  -- % thời gian kiêm nhiệm
    decision_number VARCHAR(100),
    effective_from  DATE NOT NULL,
    effective_to    DATE,                   -- NULL = đang hiệu lực
    note            TEXT,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emp_concurrent_assign_employee ON personnel.employee_concurrent_assignments(employee_id);
CREATE INDEX idx_emp_concurrent_assign_active ON personnel.employee_concurrent_assignments(employee_id, effective_to);
