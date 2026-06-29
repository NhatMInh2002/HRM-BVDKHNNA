-- V20: Multi-level leave approval + signature
-- Thêm luồng duyệt 2 cấp: trưởng phòng → TCCB

-- 1. Thêm role DEPT_HEAD vào danh sách hợp lệ (đã có cột hrm_role từ V13)
-- Không cần thay đổi cột vì hrm_role là VARCHAR tự do

-- 2. Thêm chữ ký vào nhân viên
ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS signature_url VARCHAR(500);

-- 3. Mở rộng bảng leave_requests
ALTER TABLE attendance.leave_requests
    ADD COLUMN IF NOT EXISTS dept_approved_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dept_approved_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dept_rejected_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dept_rejected_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dept_reject_note  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS hr_approved_by    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS hr_approved_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hr_rejected_by    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS hr_rejected_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hr_reject_note    VARCHAR(500),
    ADD COLUMN IF NOT EXISTS pdf_url           VARCHAR(1000);

-- 4. Cập nhật status enum: thêm DEPT_APPROVED
-- PostgreSQL không có ALTER TYPE ADD VALUE trong transaction nên dùng CHECK hoặc để VARCHAR
-- Cột status đã là VARCHAR(20) → chỉ cần thêm DEPT_APPROVED vào logic

COMMENT ON COLUMN attendance.leave_requests.dept_approved_by  IS 'Email trưởng phòng đã duyệt';
COMMENT ON COLUMN attendance.leave_requests.hr_approved_by    IS 'Email cán bộ TCCB đã duyệt';
COMMENT ON COLUMN attendance.leave_requests.pdf_url           IS 'Key của PDF quyết định trong MinIO';
