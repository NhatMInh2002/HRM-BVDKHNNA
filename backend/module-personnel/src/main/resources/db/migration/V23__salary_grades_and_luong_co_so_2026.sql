-- ============================================================
-- V23: Bảng hệ số ngạch/bậc CBCC-VC + cập nhật lương cơ sở 01/07/2026
-- Căn cứ: Nghị định 204/2004/NĐ-CP và nghị định điều chỉnh lương cơ sở 2026
-- Lương cơ sở mới: 2,530,000 VND/tháng (từ 01/07/2026)
-- ============================================================

-- 1. Bảng tham chiếu ngạch/bậc/hệ số
CREATE TABLE IF NOT EXISTS payroll.salary_grades (
    id            SERIAL PRIMARY KEY,
    ngach_code    VARCHAR(10)   NOT NULL,   -- A0, A1, A2.1, A2.2, A3.1, A3.2, B, C
    ngach_name    VARCHAR(100)  NOT NULL,
    bac           SMALLINT      NOT NULL,
    he_so         NUMERIC(5,2)  NOT NULL,
    effective_from DATE          NOT NULL DEFAULT '2026-07-01',
    UNIQUE (ngach_code, bac, effective_from)
);

-- 2. Seed hệ số theo Bảng lương chuyên môn nghiệp vụ (Bảng 2, NĐ 204/2004)
-- Ngạch C (bậc 1-12, bước nhảy 0.18)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('C','Nhân viên',1,1.50),('C','Nhân viên',2,1.68),('C','Nhân viên',3,1.86),
('C','Nhân viên',4,2.04),('C','Nhân viên',5,2.22),('C','Nhân viên',6,2.40),
('C','Nhân viên',7,2.58),('C','Nhân viên',8,2.76),('C','Nhân viên',9,2.94),
('C','Nhân viên',10,3.12),('C','Nhân viên',11,3.30),('C','Nhân viên',12,3.48)
ON CONFLICT DO NOTHING;

-- Ngạch B (bậc 1-12, bước nhảy 0.20)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('B','Nhân viên trung cấp',1,1.86),('B','Nhân viên trung cấp',2,2.06),('B','Nhân viên trung cấp',3,2.26),
('B','Nhân viên trung cấp',4,2.46),('B','Nhân viên trung cấp',5,2.66),('B','Nhân viên trung cấp',6,2.86),
('B','Nhân viên trung cấp',7,3.06),('B','Nhân viên trung cấp',8,3.26),('B','Nhân viên trung cấp',9,3.46),
('B','Nhân viên trung cấp',10,3.66),('B','Nhân viên trung cấp',11,3.86),('B','Nhân viên trung cấp',12,4.06)
ON CONFLICT DO NOTHING;

-- Ngạch A0 (bậc 1-8, bước nhảy 0.31)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A0','Cán sự / Kỹ thuật viên',1,2.10),('A0','Cán sự / Kỹ thuật viên',2,2.41),
('A0','Cán sự / Kỹ thuật viên',3,2.72),('A0','Cán sự / Kỹ thuật viên',4,3.03),
('A0','Cán sự / Kỹ thuật viên',5,3.34),('A0','Cán sự / Kỹ thuật viên',6,3.65),
('A0','Cán sự / Kỹ thuật viên',7,3.96),('A0','Cán sự / Kỹ thuật viên',8,4.27)
ON CONFLICT DO NOTHING;

-- Ngạch A1 (bậc 1-9, bước nhảy 0.33)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',1,2.34),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',2,2.67),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',3,3.00),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',4,3.33),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',5,3.66),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',6,3.99),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',7,4.32),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',8,4.65),
('A1','Chuyên viên / Bác sĩ / Điều dưỡng hạng II-III',9,4.98)
ON CONFLICT DO NOTHING;

-- Ngạch A2.2 (bậc 1-8, bước nhảy 0.34)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',1,4.00),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',2,4.34),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',3,4.68),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',4,5.02),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',5,5.36),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',6,5.70),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',7,6.04),
('A2.2','Chuyên viên chính / Bác sĩ hạng II / Điều dưỡng hạng I',8,6.38)
ON CONFLICT DO NOTHING;

-- Ngạch A2.1 (bậc 1-8, bước nhảy 0.34)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',1,4.40),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',2,4.74),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',3,5.08),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',4,5.42),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',5,5.76),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',6,6.10),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',7,6.44),
('A2.1','Chuyên viên cao cấp / Bác sĩ chuyên khoa II',8,6.78)
ON CONFLICT DO NOTHING;

-- Ngạch A3.2 (bậc 1-6, bước nhảy 0.36)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A3.2','Cao cấp / Bác sĩ hạng I / PGS',1,5.75),('A3.2','Cao cấp / Bác sĩ hạng I / PGS',2,6.11),
('A3.2','Cao cấp / Bác sĩ hạng I / PGS',3,6.47),('A3.2','Cao cấp / Bác sĩ hạng I / PGS',4,6.83),
('A3.2','Cao cấp / Bác sĩ hạng I / PGS',5,7.19),('A3.2','Cao cấp / Bác sĩ hạng I / PGS',6,7.55)
ON CONFLICT DO NOTHING;

-- Ngạch A3.1 (bậc 1-6, bước nhảy 0.36)
INSERT INTO payroll.salary_grades (ngach_code, ngach_name, bac, he_so) VALUES
('A3.1','Giáo sư / GS cao cấp',1,6.20),('A3.1','Giáo sư / GS cao cấp',2,6.56),
('A3.1','Giáo sư / GS cao cấp',3,6.92),('A3.1','Giáo sư / GS cao cấp',4,7.28),
('A3.1','Giáo sư / GS cao cấp',5,7.64),('A3.1','Giáo sư / GS cao cấp',6,8.00)
ON CONFLICT DO NOTHING;

-- 3. Cập nhật salary_config VC001 — đóng bản ghi cũ, tạo mới từ 01/07/2026
-- Điều dưỡng hạng III bậc 5 ngạch B, hệ số 2.66
-- Lương bậc mới  = 2,530,000 × 2.66 = 6,729,800
-- Phụ cấp ưu đãi nghề 25% = 6,729,800 × 25% = 1,682,450
-- Phụ cấp độc hại cấp 2 (0.2 × 2,530,000) = 506,000
-- Phụ cấp ăn trưa: 730,000 (giữ nguyên)
-- Phụ cấp đi lại: 300,000 (giữ nguyên)
UPDATE payroll.salary_configs
SET effective_to = '2026-06-30'
WHERE employee_id = '11111111-0000-0000-0000-000000000001'::UUID
  AND effective_to IS NULL;

INSERT INTO payroll.salary_configs (
    id, employee_id,
    basic_salary, coefficient,
    allowance_seniority,
    allowance_toxic,
    allowance_food,
    allowance_transport,
    allowance_phone,
    allowance_position,
    allowance_other,
    allowance_house,
    dependents,
    bhxh_exempt,
    effective_from,
    created_by
)
SELECT
    gen_random_uuid(),
    '11111111-0000-0000-0000-000000000001'::UUID,
    6729800,    -- 2,530,000 × 2.66
    2.66,
    1682450,    -- 25% phụ cấp ưu đãi nghề y tế
    506000,     -- phụ cấp độc hại cấp 2 (0.2 × 2,530,000)
    730000,     -- phụ cấp ăn trưa (tối đa miễn thuế, giữ nguyên)
    300000,     -- phụ cấp đi lại
    0, 0, 0, 0,
    1,
    FALSE,
    '2026-07-01'::DATE,
    'system-v23'
WHERE NOT EXISTS (
    SELECT 1 FROM payroll.salary_configs
    WHERE employee_id = '11111111-0000-0000-0000-000000000001'::UUID
      AND effective_from = '2026-07-01'::DATE
);
