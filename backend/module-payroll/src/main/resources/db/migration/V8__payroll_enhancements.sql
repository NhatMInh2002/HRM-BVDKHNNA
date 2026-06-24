-- V8: Bổ sung hệ số lương & các trường bảng lương theo quy định VN
-- Ref: Luật BHXH 2024, Thông tư 111/2013/TT-BTC, Nghị định 38/2022/NĐ-CP

-- ── salary_configs: thêm phụ cấp & số người phụ thuộc ─────────────────────────
ALTER TABLE payroll.salary_configs
    ADD COLUMN IF NOT EXISTS dependents         SMALLINT       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowance_position NUMERIC(15,2)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowance_seniority NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowance_toxic    NUMERIC(15,2)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowance_house    NUMERIC(15,2)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bhxh_exempt        BOOLEAN        NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN payroll.salary_configs.dependents          IS 'Số người phụ thuộc — giảm trừ 4.4 triệu/người/tháng vào thu nhập chịu thuế TNCN';
COMMENT ON COLUMN payroll.salary_configs.allowance_position  IS 'Phụ cấp chức vụ (tính vào gross, chịu thuế TNCN)';
COMMENT ON COLUMN payroll.salary_configs.allowance_seniority IS 'Phụ cấp thâm niên (tính vào gross, chịu thuế TNCN)';
COMMENT ON COLUMN payroll.salary_configs.allowance_toxic     IS 'Phụ cấp độc hại/nguy hiểm — miễn BHXH và miễn thuế TNCN (TT 111/2013)';
COMMENT ON COLUMN payroll.salary_configs.allowance_house     IS 'Phụ cấp nhà ở (tính vào gross, chịu thuế TNCN nếu vượt ngưỡng)';
COMMENT ON COLUMN payroll.salary_configs.bhxh_exempt         IS 'TRUE nếu nhân viên không thuộc đối tượng đóng BHXH (hợp đồng < 1 tháng, thử việc ngắn hạn...)';

-- ── payroll_records: thêm phần đóng góp chủ sử dụng & bonus ──────────────────
ALTER TABLE payroll.payroll_records
    ADD COLUMN IF NOT EXISTS bhxh_employer   NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bhyt_employer   NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bhtn_employer   NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bhtnld_employer NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_exempt_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bonus           NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS taxable_income  NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS personal_deduction   NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dependent_deduction  NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_employer_cost  NUMERIC(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN payroll.payroll_records.bhxh_employer   IS 'BHXH chủ sử dụng 17.5% (hưu trí 14% + ốm đau 3% + thai sản 0.5%)';
COMMENT ON COLUMN payroll.payroll_records.bhyt_employer   IS 'BHYT chủ sử dụng 3%';
COMMENT ON COLUMN payroll.payroll_records.bhtn_employer   IS 'BHTN chủ sử dụng 1%';
COMMENT ON COLUMN payroll.payroll_records.bhtnld_employer IS 'BHTNLĐ-BNN chủ sử dụng 0.5%';
COMMENT ON COLUMN payroll.payroll_records.tax_exempt_allowance IS 'Phụ cấp miễn thuế & BHXH (ăn ca ≤730K + phụ cấp độc hại)';
COMMENT ON COLUMN payroll.payroll_records.bonus           IS 'Thưởng tháng (tính vào gross, chịu thuế TNCN)';
COMMENT ON COLUMN payroll.payroll_records.taxable_income  IS 'Thu nhập chịu thuế TNCN sau giảm trừ';
COMMENT ON COLUMN payroll.payroll_records.personal_deduction  IS 'Giảm trừ bản thân 11 triệu/tháng';
COMMENT ON COLUMN payroll.payroll_records.dependent_deduction IS 'Giảm trừ người phụ thuộc 4.4 triệu/người/tháng';
COMMENT ON COLUMN payroll.payroll_records.total_employer_cost IS 'Tổng chi phí chủ sử dụng = grossSalary + tất cả phần đóng BHXH/BHYT/BHTN/BHTNLĐ của chủ';
