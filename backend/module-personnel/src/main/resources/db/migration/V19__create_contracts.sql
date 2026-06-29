CREATE TABLE personnel.contracts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id      UUID         NOT NULL REFERENCES personnel.employees(id),
    contract_number  VARCHAR(50)  NOT NULL UNIQUE,
    contract_type    VARCHAR(30)  NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    start_date       DATE         NOT NULL,
    end_date         DATE,                          -- NULL = không xác định thời hạn
    sign_date        DATE         NOT NULL,
    signer_name      VARCHAR(100),                  -- Người ký phía bệnh viện
    position         VARCHAR(100),
    department_name  VARCHAR(150),
    -- Lương (mã hóa ở tầng ứng dụng nếu cần, hiện lưu plain cho MVP)
    base_salary      NUMERIC(15,2),
    salary_grade     VARCHAR(20),                   -- Ngạch/bậc lương (ví dụ: BS.III/5)
    salary_coefficient NUMERIC(5,3),                -- Hệ số lương
    -- Phụ cấp
    allowance_position   NUMERIC(15,2) DEFAULT 0,   -- Phụ cấp chức vụ
    allowance_seniority  NUMERIC(15,2) DEFAULT 0,   -- Phụ cấp thâm niên
    allowance_other      NUMERIC(15,2) DEFAULT 0,   -- Phụ cấp khác
    -- File đính kèm
    attachment_url   VARCHAR(1000),
    attachment_name  VARCHAR(255),
    notes            TEXT,
    created_by       VARCHAR(100) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_employee   ON personnel.contracts(employee_id);
CREATE INDEX idx_contracts_status     ON personnel.contracts(status);
CREATE INDEX idx_contracts_end_date   ON personnel.contracts(end_date);
