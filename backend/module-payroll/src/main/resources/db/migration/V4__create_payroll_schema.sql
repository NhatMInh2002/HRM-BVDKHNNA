CREATE SCHEMA IF NOT EXISTS payroll;

-- Cấu hình lương nhân viên (1 bản ghi active per employee)
CREATE TABLE payroll.salary_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL,
    basic_salary    NUMERIC(15,2) NOT NULL DEFAULT 0,
    allowance_food  NUMERIC(15,2) NOT NULL DEFAULT 0,   -- phụ cấp ăn trưa
    allowance_transport NUMERIC(15,2) NOT NULL DEFAULT 0, -- phụ cấp đi lại
    allowance_phone NUMERIC(15,2) NOT NULL DEFAULT 0,   -- phụ cấp điện thoại
    allowance_other NUMERIC(15,2) NOT NULL DEFAULT 0,   -- phụ cấp khác
    coefficient     NUMERIC(5,2)  NOT NULL DEFAULT 1.00, -- hệ số lương
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salary_configs_employee ON payroll.salary_configs(employee_id);
CREATE INDEX idx_salary_configs_effective ON payroll.salary_configs(employee_id, effective_from DESC);

-- Bảng lương tháng
CREATE TABLE payroll.payroll_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL,
    period_year     SMALLINT NOT NULL,
    period_month    SMALLINT NOT NULL,
    -- Thu nhập
    basic_salary    NUMERIC(15,2) NOT NULL,
    total_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    ot_pay          NUMERIC(15,2) NOT NULL DEFAULT 0,   -- lương tăng ca
    gross_salary    NUMERIC(15,2) NOT NULL,
    -- Khấu trừ
    bhxh_employee   NUMERIC(15,2) NOT NULL DEFAULT 0,   -- 8% BHXH NLĐ
    bhyt_employee   NUMERIC(15,2) NOT NULL DEFAULT 0,   -- 1.5% BHYT NLĐ
    bhtn_employee   NUMERIC(15,2) NOT NULL DEFAULT 0,   -- 1% BHTN NLĐ
    pit             NUMERIC(15,2) NOT NULL DEFAULT 0,   -- thuế TNCN
    other_deduction NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_deduction NUMERIC(15,2) NOT NULL,
    net_salary      NUMERIC(15,2) NOT NULL,
    -- Thống kê công
    working_days    SMALLINT NOT NULL DEFAULT 0,
    actual_days     SMALLINT NOT NULL DEFAULT 0,
    ot_hours        NUMERIC(5,2)  NOT NULL DEFAULT 0,
    -- Trạng thái
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, PAID
    note            TEXT,
    approved_by     VARCHAR(100),
    approved_at     TIMESTAMP,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, period_year, period_month)
);

CREATE INDEX idx_payroll_records_period ON payroll.payroll_records(period_year, period_month);
CREATE INDEX idx_payroll_records_employee ON payroll.payroll_records(employee_id);
