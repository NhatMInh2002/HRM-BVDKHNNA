-- ============================================================
-- V37: Bảng cấu hình lương cơ sở theo thời gian hiệu lực.
-- Thay cho hằng số hard-code trong code — khi có Nghị định mới
-- chỉ cần INSERT 1 dòng, không sửa code.
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll.base_salary_configs (
    id             SERIAL PRIMARY KEY,
    amount         NUMERIC(15,2) NOT NULL,
    effective_from DATE NOT NULL UNIQUE,
    legal_basis    VARCHAR(255),
    created_by     VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO payroll.base_salary_configs (amount, effective_from, legal_basis) VALUES
(2340000, '2024-07-01', 'Nghị định 73/2024/NĐ-CP'),
(2530000, '2026-07-01', 'Nghị định điều chỉnh lương cơ sở 2026 (dự kiến)')
ON CONFLICT (effective_from) DO NOTHING;
