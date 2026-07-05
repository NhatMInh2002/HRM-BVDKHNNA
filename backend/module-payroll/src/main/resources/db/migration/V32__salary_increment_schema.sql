-- ============================================================
-- V32: Lương tăng thêm (thu nhập tăng thêm - TNTT) — Điều 34/35
-- Quy chế chi tiêu nội bộ 2026, tr.48-58.
-- Công thức:
--   TNTT = lương cơ sở × (hệ số trách nhiệm + hệ số trình độ điều chỉnh
--          + hệ số kiêm nhiệm đoàn thể + hệ số kiêm nhiệm khoa/phòng)
--          × %xếp loại thi đua × (ngày công thực tế / ngày công chuẩn)
--          × số lần chi trả
-- Bảng hệ số được seed ở migration riêng sau khi đối chiếu đầy đủ với
-- phụ lục quy chế (tr.49-58) — KHÔNG seed số liệu chưa xác nhận đầy đủ.
-- ============================================================

-- 1. Hệ số trách nhiệm/chức vụ (Điều 34, tr.50)
CREATE TABLE IF NOT EXISTS payroll.responsibility_coefficients (
    id            SERIAL PRIMARY KEY,
    position_name VARCHAR(150) NOT NULL,
    coefficient   NUMERIC(5,2) NOT NULL,
    display_order SMALLINT     NOT NULL DEFAULT 0,
    effective_from DATE        NOT NULL DEFAULT '2026-01-01'
);

-- 2. Hệ số trình độ chuyên môn (Điều 34, tr.49)
CREATE TABLE IF NOT EXISTS payroll.qualification_coefficients (
    id                 SERIAL PRIMARY KEY,
    qualification_name VARCHAR(150) NOT NULL,
    coefficient        NUMERIC(5,2) NOT NULL,
    display_order      SMALLINT     NOT NULL DEFAULT 0,
    effective_from     DATE         NOT NULL DEFAULT '2026-01-01'
);

-- 3. Hệ số kiêm nhiệm đoàn thể (Điều 34.6, tr.50-51)
CREATE TABLE IF NOT EXISTS payroll.concurrent_role_coefficients (
    id            SERIAL PRIMARY KEY,
    role_name     VARCHAR(150) NOT NULL,
    coefficient   NUMERIC(5,2) NOT NULL,
    display_order SMALLINT     NOT NULL DEFAULT 0,
    effective_from DATE        NOT NULL DEFAULT '2026-01-01'
);

-- 4. Tỷ lệ xếp loại thi đua A1-C2 (Điều 35, tr.55)
CREATE TABLE IF NOT EXISTS payroll.merit_rating_scale (
    rating_code VARCHAR(5) PRIMARY KEY,   -- A1, A2, B1, B2, C1, C2
    rating_name VARCHAR(100) NOT NULL,
    percentage  NUMERIC(5,2) NOT NULL,    -- 100, 80, 70, 60, 50, 0
    display_order SMALLINT NOT NULL DEFAULT 0
);

-- 5. Cấu hình lương tăng thêm theo nhân viên (1 bản ghi active per employee,
--    versioned theo effective_from giống payroll.salary_configs)
CREATE TABLE IF NOT EXISTS payroll.salary_increment_configs (
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id                   UUID NOT NULL,

    responsibility_coefficient    NUMERIC(5,2) NOT NULL DEFAULT 0,  -- hệ số trách nhiệm/chức vụ chính
    -- Kiêm nhiệm quản lý chức vụ thứ 2 (nếu có) — hưởng thêm 25% hệ số của chức vụ này (tr.50)
    responsibility_secondary_coefficient NUMERIC(5,2) NOT NULL DEFAULT 0,
    qualification_coefficient     NUMERIC(5,2) NOT NULL DEFAULT 0,  -- hệ số trình độ (trước điều chỉnh)
    -- NONE | MISSING_LICENSE (×85%, thiếu CCHN) | BRIDGE_DEGREE (×95%, bằng liên thông)
    qualification_adjustment      VARCHAR(20)  NOT NULL DEFAULT 'NONE',

    concurrent_union_coefficient  NUMERIC(5,2) NOT NULL DEFAULT 0,  -- hệ số kiêm nhiệm đoàn thể

    -- Hệ số đặc thù khoa/phòng (cấp cứu, hồi sức, ghép tạng...) — 110-135% trên hệ số
    -- trình độ đã điều chỉnh. 100 = không áp dụng. (Điều 34, tr.52 — cần xác nhận danh
    -- sách khoa/phòng đặc thù và % chính xác với Phòng TCCB trước khi dùng số liệu thật.)
    specialty_multiplier_percent NUMERIC(5,2) NOT NULL DEFAULT 100,

    -- Kiêm nhiệm khoa/phòng khác: +10% (BS/DS) hoặc +5% (ĐD/KTV) trên hệ số trình độ
    -- (đã nhân hệ số đặc thù), nhân theo % thời gian kiêm nhiệm.
    -- Công thức xác nhận theo ví dụ tr.53: HS = gốc + (gốc × %phụ_trội × %thời_gian)
    concurrent_dept_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 10 hoặc 5
    concurrent_dept_time_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,  -- % thời gian kiêm nhiệm

    rating_code                   VARCHAR(5),                       -- A1..C2, snapshot tại effective_from
    rating_percentage             NUMERIC(5,2) NOT NULL DEFAULT 100,-- snapshot % xếp loại tại thời điểm lưu

    workdays_actual               SMALLINT     NOT NULL DEFAULT 22,
    workdays_standard             SMALLINT     NOT NULL DEFAULT 22,
    payment_multiplier            NUMERIC(4,2) NOT NULL DEFAULT 1,  -- số lần chi trả

    effective_from                DATE NOT NULL,
    effective_to                  DATE,

    created_by                    VARCHAR(100) NOT NULL,
    created_at                    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salary_increment_configs_employee ON payroll.salary_increment_configs(employee_id);
CREATE INDEX idx_salary_increment_configs_effective ON payroll.salary_increment_configs(employee_id, effective_from DESC);
