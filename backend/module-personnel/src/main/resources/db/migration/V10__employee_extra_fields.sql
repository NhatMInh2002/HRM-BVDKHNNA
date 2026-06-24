-- V10: Bổ sung các trường cán bộ từ danh sách nhập Excel
ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS education_level VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ethnicity       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS religion        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS hometown        VARCHAR(200),
    ADD COLUMN IF NOT EXISTS address         VARCHAR(200);

COMMENT ON COLUMN personnel.employees.education_level IS 'Trình độ học vấn/chuyên môn (Tiến sĩ, Thạc sĩ, Bác sĩ, Điều dưỡng...)';
COMMENT ON COLUMN personnel.employees.ethnicity        IS 'Dân tộc (54 dân tộc Việt Nam)';
COMMENT ON COLUMN personnel.employees.religion         IS 'Tôn giáo';
COMMENT ON COLUMN personnel.employees.hometown         IS 'Quê quán';
COMMENT ON COLUMN personnel.employees.address          IS 'Địa chỉ thường trú';
