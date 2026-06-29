-- ============================================================
-- V25 — Onboarding checklist + KPI module
-- ============================================================

-- ─── ONBOARDING ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS personnel.onboarding_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personnel.onboarding_template_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES personnel.onboarding_templates(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    due_days    INTEGER NOT NULL DEFAULT 3,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS personnel.onboarding_checklists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES personnel.employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES personnel.onboarding_templates(id),
    start_date  DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personnel.onboarding_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id    UUID NOT NULL REFERENCES personnel.onboarding_checklists(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    due_date        DATE,
    completed_at    TIMESTAMP,
    completed_by    UUID,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes           TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_employee ON personnel.onboarding_checklists(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_checklist ON personnel.onboarding_tasks(checklist_id);

-- Seed: mẫu onboarding mặc định cho BVHN Nghệ An
INSERT INTO personnel.onboarding_templates (id, name, description) VALUES
('00000000-0000-0000-0001-000000000001', 'Quy trình tiếp nhận nhân viên mới', 'Checklist chuẩn cho toàn bệnh viện')
ON CONFLICT DO NOTHING;

INSERT INTO personnel.onboarding_template_tasks (template_id, title, category, due_days, sort_order, is_required) VALUES
('00000000-0000-0000-0001-000000000001', 'Nộp hồ sơ gốc (CMND/CCCD, bằng cấp, lý lịch)', 'DOCUMENTS', 1, 1, true),
('00000000-0000-0000-0001-000000000001', 'Ký hợp đồng lao động / quyết định tuyển dụng', 'DOCUMENTS', 1, 2, true),
('00000000-0000-0000-0001-000000000001', 'Đăng ký BHXH, BHYT, BHTN', 'INSURANCE', 3, 3, true),
('00000000-0000-0000-0001-000000000001', 'Cấp thẻ nhân viên / thẻ ra vào', 'SYSTEM', 2, 4, true),
('00000000-0000-0000-0001-000000000001', 'Cấp tài khoản email, hệ thống HRM', 'SYSTEM', 1, 5, true),
('00000000-0000-0000-0001-000000000001', 'Khám sức khỏe đầu vào', 'HEALTH', 7, 6, true),
('00000000-0000-0000-0001-000000000001', 'Tham gia đào tạo định hướng (an toàn bệnh viện, KSNK)', 'TRAINING', 14, 7, true),
('00000000-0000-0000-0001-000000000001', 'Bàn giao dụng cụ / thiết bị làm việc', 'EQUIPMENT', 3, 8, false),
('00000000-0000-0000-0001-000000000001', 'Giới thiệu với phòng ban và quản lý trực tiếp', 'ORIENTATION', 1, 9, false),
('00000000-0000-0000-0001-000000000001', 'Hoàn tất đăng ký ngân hàng nhận lương', 'FINANCE', 5, 10, true)
ON CONFLICT DO NOTHING;

-- ─── KPI ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS personnel.kpi_periods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL DEFAULT 'QUARTERLY',
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personnel.kpi_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id       UUID NOT NULL REFERENCES personnel.kpi_periods(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES personnel.employees(id) ON DELETE CASCADE,
    department_id   UUID,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) NOT NULL DEFAULT 'WORK',
    weight          NUMERIC(5,2) NOT NULL DEFAULT 100,
    target_value    NUMERIC(12,2),
    target_unit     VARCHAR(50),
    actual_value    NUMERIC(12,2),
    score           NUMERIC(5,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personnel.kpi_evaluations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id       UUID NOT NULL REFERENCES personnel.kpi_periods(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES personnel.employees(id) ON DELETE CASCADE,
    evaluator_id    UUID,
    total_score     NUMERIC(5,2),
    rating          VARCHAR(20),
    self_review     TEXT,
    manager_review  TEXT,
    strengths       TEXT,
    improvements    TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'SELF_REVIEW',
    submitted_at    TIMESTAMP,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_goals_employee  ON personnel.kpi_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_goals_period    ON personnel.kpi_goals(period_id);
CREATE INDEX IF NOT EXISTS idx_kpi_eval_employee   ON personnel.kpi_evaluations(employee_id);

-- Seed: kỳ KPI Q2 và Q3 2026
INSERT INTO personnel.kpi_periods (id, name, period_type, start_date, end_date, status) VALUES
('00000000-0000-0000-0002-000000000001', 'Quý 2/2026', 'QUARTERLY', '2026-04-01', '2026-06-30', 'CLOSED'),
('00000000-0000-0000-0002-000000000002', 'Quý 3/2026', 'QUARTERLY', '2026-07-01', '2026-09-30', 'OPEN')
ON CONFLICT DO NOTHING;
