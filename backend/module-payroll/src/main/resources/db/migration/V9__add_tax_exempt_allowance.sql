-- V9: Thêm cột tax_exempt_allowance còn thiếu trong V8
ALTER TABLE payroll.payroll_records
    ADD COLUMN IF NOT EXISTS tax_exempt_allowance NUMERIC(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN payroll.payroll_records.tax_exempt_allowance
    IS 'Phụ cấp miễn thuế & BHXH (ăn ca ≤730K + phụ cấp độc hại) — không tính vào thu nhập chịu thuế TNCN';
