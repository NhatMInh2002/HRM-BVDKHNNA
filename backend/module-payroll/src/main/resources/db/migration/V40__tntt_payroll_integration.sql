-- ============================================================
-- V40: Tích hợp thu nhập tăng thêm (TNTT) vào bảng lương.
--   1. Bảng % đặc thù khoa/phòng (thay nhập tay từng người)
--   2. Cột salary_increment trên payroll_records
--   3. Workflow duyệt cấu hình TNTT (status + người/thời điểm duyệt)
-- Xử lý thuế: TNTT CHỊU thuế TNCN, KHÔNG tính đóng BHXH — cần Phòng TCCB
-- xác nhận lại trước khi chạy chính thức (xem 3 câu hỏi then chốt).
-- ============================================================

-- 1. % đặc thù khoa/phòng (Điều 34, tr.52)
-- Mặc định seed 100% cho toàn bộ khoa để KHÔNG tự động thay đổi lương khi
-- chưa có xác nhận. Phòng TCCB cập nhật 110-135% cho khoa đặc thù sau.
CREATE TABLE IF NOT EXISTS payroll.specialty_department_multipliers (
    id             SERIAL PRIMARY KEY,
    department_id  UUID NOT NULL UNIQUE,
    percent        NUMERIC(5,2) NOT NULL DEFAULT 100,   -- 100 = không phụ trội
    note           VARCHAR(255),
    updated_by     VARCHAR(100),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE payroll.specialty_department_multipliers
    IS 'Hệ số đặc thù khoa/phòng (%) áp lên hệ số trình độ TNTT. 100 = không áp dụng. Cần TCCB xác nhận danh sách khoa đặc thù.';

-- 2. TNTT trên bảng lương
ALTER TABLE payroll.payroll_records
    ADD COLUMN IF NOT EXISTS salary_increment NUMERIC(15,2) NOT NULL DEFAULT 0;
COMMENT ON COLUMN payroll.payroll_records.salary_increment
    IS 'Thu nhập tăng thêm (TNTT) — chịu thuế TNCN, KHÔNG tính đóng BHXH. Nguồn: salary_increment_configs hiệu lực tại kỳ lương.';

-- 3. Workflow duyệt cấu hình TNTT
ALTER TABLE payroll.salary_increment_configs
    ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT | APPROVED
    ADD COLUMN IF NOT EXISTS approved_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMP;
COMMENT ON COLUMN payroll.salary_increment_configs.status
    IS 'DRAFT = chờ duyệt (không dùng để tính lương), APPROVED = đã duyệt (được tính vào bảng lương)';
