-- Personnel module schema
CREATE SCHEMA IF NOT EXISTS personnel;

CREATE TABLE personnel.departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    parent_id   UUID REFERENCES personnel.departments(id),
    manager_id  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE personnel.employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code   VARCHAR(20)  NOT NULL UNIQUE,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    phone           VARCHAR(20),
    gender          VARCHAR(10),
    date_of_birth   DATE,
    -- national_id lưu dạng mã hóa (NĐ 13/2023)
    national_id     VARCHAR(255),
    join_date       DATE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PROBATION',
    contract_type   VARCHAR(20),
    department_id   UUID REFERENCES personnel.departments(id),
    position        VARCHAR(100),
    manager_id      UUID REFERENCES personnel.employees(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100) NOT NULL
);

-- Audit log bất biến cho mọi thay đổi nhân viên (bắt buộc KTNN)
CREATE TABLE personnel.employee_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    employee_id UUID        NOT NULL,
    action      VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
    changed_by  VARCHAR(100) NOT NULL,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_data    JSONB,
    new_data    JSONB
);

CREATE INDEX idx_employee_audit_employee_id ON personnel.employee_audit_log(employee_id);
CREATE INDEX idx_employees_department ON personnel.employees(department_id);
CREATE INDEX idx_employees_status ON personnel.employees(status);
