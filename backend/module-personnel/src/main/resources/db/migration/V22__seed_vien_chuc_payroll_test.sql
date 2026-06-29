-- ============================================================
-- V22: Dữ liệu test viên chức y tế (Điều dưỡng hạng III, bậc 3)
-- Mức lương cơ sở 2024: 2,340,000 VND (NĐ 73/2024/NĐ-CP)
-- ============================================================

-- 1. Nhân viên viên chức
INSERT INTO personnel.employees (
    id, employee_code, full_name, email, phone, gender,
    date_of_birth, join_date, status, contract_type,
    department_id, position, hrm_role,
    password_hash, created_by
)
SELECT
    '11111111-0000-0000-0000-000000000001'::UUID,
    'VC001',
    'Nguyễn Thị Mai',
    'nt.mai@bvnghean.vn',
    '0912345601',
    'FEMALE',
    '1990-06-15'::DATE,
    '2015-09-01'::DATE,
    'ACTIVE',
    'INDEFINITE',
    (SELECT id FROM personnel.departments WHERE code = 'P-DD' LIMIT 1),
    'Điều dưỡng hạng III',
    'EMPLOYEE',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TipxB.oZqwTFQWP3w4MkqS0l7pGG', -- pass: Abcd1234!
    'system'
WHERE NOT EXISTS (SELECT 1 FROM personnel.employees WHERE employee_code = 'VC001')
  AND EXISTS (SELECT 1 FROM personnel.departments WHERE code = 'P-DD');

-- 2. Cấu hình lương viên chức
-- Điều dưỡng hạng III bậc 3: hệ số 2.66
-- Lương bậc = 2,340,000 × 2.66 = 6,224,400
-- Phụ cấp ưu đãi nghề y tế 25%: 2,340,000 × 2.66 × 25% = 1,556,100 → đưa vào allowance_seniority
-- Phụ cấp độc hại cấp 2 (0.2×2,340,000): 468,000 → allowance_toxic (miễn thuế, miễn BHXH)
-- Phụ cấp ăn trưa: 730,000 → allowance_food (miễn thuế ≤730k)
-- Phụ cấp đi lại: 300,000 → allowance_transport (tính vào gross, chịu thuế)
INSERT INTO payroll.salary_configs (
    id, employee_id,
    basic_salary, coefficient,
    allowance_seniority,   -- phụ cấp ưu đãi nghề
    allowance_toxic,       -- phụ cấp độc hại (miễn thuế)
    allowance_food,        -- phụ cấp ăn trưa (miễn thuế ≤730k)
    allowance_transport,   -- phụ cấp đi lại (chịu thuế)
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
    6224400,    -- 2,340,000 × 2.66
    2.66,
    1556100,    -- 25% phụ cấp ưu đãi nghề y tế
    468000,     -- phụ cấp độc hại cấp 2
    730000,     -- phụ cấp ăn trưa (tối đa miễn thuế)
    300000,     -- phụ cấp đi lại
    0,
    0,
    0,
    0,
    1,          -- 1 người phụ thuộc (con nhỏ)
    FALSE,
    '2024-07-01'::DATE,
    'system'
WHERE EXISTS (SELECT 1 FROM personnel.employees WHERE employee_code = 'VC001')
  AND NOT EXISTS (SELECT 1 FROM payroll.salary_configs WHERE employee_id = '11111111-0000-0000-0000-000000000001'::UUID);

-- 3. Bảng lương tháng 6/2026
-- ─── Tính toán ───────────────────────────────────────────────
-- Gross (chịu BHXH) = lương bậc + phụ cấp ưu đãi nghề + phụ cấp đi lại
--   = 6,224,400 + 1,556,100 + 300,000 = 8,080,500
-- Tax-exempt allowances = phụ cấp độc hại + ăn trưa = 468,000 + 730,000 = 1,198,000
--
-- BHXH NLĐ  8%  × 8,080,500 = 646,440
-- BHYT NLĐ  1.5%× 8,080,500 = 121,208
-- BHTN NLĐ  1%  × 8,080,500 =  80,805  → tổng NLĐ = 848,453
--
-- BHXH NSD  17.5%× 8,080,500 = 1,414,088
-- BHYT NSD  3%  × 8,080,500 =  242,415
-- BHTN NSD  1%  × 8,080,500 =   80,805
-- BHTNLĐ   0.5%× 8,080,500 =   40,403  → tổng NSD = 1,777,711
--
-- Thu nhập tính thuế = gross - BH_NLĐ = 8,080,500 - 848,453 = 7,232,047
-- Giảm trừ bản thân  = 11,000,000
-- Giảm trừ PT 1 người= 4,400,000
-- Tổng giảm trừ = 15,400,000 > thu nhập → Thuế TNCN = 0
--
-- Net = gross + tax_exempt - BH_NLĐ - PIT
--     = 8,080,500 + 1,198,000 - 848,453 - 0 = 8,430,047
-- ─────────────────────────────────────────────────────────────
INSERT INTO payroll.payroll_records (
    id, employee_id, period_year, period_month,
    basic_salary, total_allowance, ot_pay, gross_salary,
    tax_exempt_allowance,
    bhxh_employee, bhyt_employee, bhtn_employee,
    bhxh_employer, bhyt_employer, bhtn_employer, bhtnld_employer,
    pit,
    personal_deduction, dependent_deduction, taxable_income,
    other_deduction, total_deduction, net_salary,
    total_employer_cost,
    working_days, actual_days, ot_hours,
    bonus, status, note, created_by
)
SELECT
    gen_random_uuid(),
    '11111111-0000-0000-0000-000000000001'::UUID,
    2026, 6,
    6224400,            -- lương bậc
    1856100,            -- phụ cấp ưu đãi nghề + đi lại (chịu thuế) = 1,556,100 + 300,000
    0,                  -- OT
    8080500,            -- gross = 6,224,400 + 1,556,100 + 300,000
    1198000,            -- phụ cấp miễn thuế (độc hại + ăn trưa)
    646440,             -- BHXH NLĐ 8%
    121208,             -- BHYT NLĐ 1.5%
    80805,              -- BHTN NLĐ 1%
    1414088,            -- BHXH NSD 17.5%
    242415,             -- BHYT NSD 3%
    80805,              -- BHTN NSD 1%
    40403,              -- BHTNLĐ NSD 0.5%
    0,                  -- PIT = 0 (thu nhập < giảm trừ)
    11000000,           -- giảm trừ bản thân
    4400000,            -- giảm trừ 1 người phụ thuộc
    0,                  -- thu nhập chịu thuế (âm → 0)
    0,
    848453,             -- tổng khấu trừ NLĐ
    8430047,            -- net = gross + exempt - BH_NLĐ
    9857711,            -- chi phí NSD = gross + tổng BH NSD = 8,080,500 + 1,777,711 (+ ăn trưa theo thực tế 730,000)
    26,                 -- ngày công chuẩn tháng 6
    26,                 -- ngày làm thực tế (đủ công)
    0,
    0,
    'APPROVED',
    'Lương tháng 6/2026 — Điều dưỡng hạng III bậc 3, đủ công',
    'system'
WHERE EXISTS (SELECT 1 FROM personnel.employees WHERE employee_code = 'VC001')
  AND NOT EXISTS (
      SELECT 1 FROM payroll.payroll_records
      WHERE employee_id = '11111111-0000-0000-0000-000000000001'::UUID
        AND period_year = 2026 AND period_month = 6
  );
