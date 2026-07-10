-- ============================================================
-- V39: Mở rộng hồ sơ lý lịch viên chức theo mẫu HS02-VC/BNV
-- (Thông tư 07/2019/TT-BNV). Gồm:
--   1. ~25 cột bổ sung trên personnel.employees
--   2. Quá trình công tác
--   3. Quá trình đào tạo, bồi dưỡng
--   4. Quan hệ gia đình (bản thân + bên vợ/chồng)
--   5. Khen thưởng / Kỷ luật
-- Trường nhạy cảm (số BHXH, sức khỏe) mã hóa ở tầng ứng dụng
-- (EncryptedPiiConverter) — cột để VARCHAR đủ dài chứa ciphertext.
-- ============================================================

ALTER TABLE personnel.employees
    -- Mục 1-15: thông tin chung
    ADD COLUMN IF NOT EXISTS birth_place              VARCHAR(200),  -- nơi sinh
    ADD COLUMN IF NOT EXISTS national_id_issue_date   DATE,          -- ngày cấp CCCD
    ADD COLUMN IF NOT EXISTS national_id_issue_place  VARCHAR(200),  -- nơi cấp CCCD
    ADD COLUMN IF NOT EXISTS social_insurance_no      VARCHAR(255),  -- số sổ BHXH (mã hóa)
    ADD COLUMN IF NOT EXISTS health_insurance_no      VARCHAR(255),  -- số thẻ BHYT (mã hóa)
    ADD COLUMN IF NOT EXISTS family_origin            VARCHAR(100),  -- thành phần gia đình xuất thân
    ADD COLUMN IF NOT EXISTS job_before_recruitment   VARCHAR(200),  -- nghề nghiệp trước khi tuyển dụng
    ADD COLUMN IF NOT EXISTS recruitment_date         DATE,          -- ngày tuyển dụng
    ADD COLUMN IF NOT EXISTS recruitment_agency       VARCHAR(200),  -- cơ quan tuyển dụng
    -- Mục 16-22: ngạch/bậc & trình độ
    ADD COLUMN IF NOT EXISTS ngach_code               VARCHAR(20),   -- mã ngạch/chức danh nghề nghiệp
    ADD COLUMN IF NOT EXISTS salary_grade             SMALLINT,      -- bậc lương
    ADD COLUMN IF NOT EXISTS salary_coefficient       NUMERIC(5,2),  -- hệ số lương
    ADD COLUMN IF NOT EXISTS salary_effective_date    DATE,          -- ngày hưởng bậc lương
    ADD COLUMN IF NOT EXISTS education_general        VARCHAR(50),   -- giáo dục phổ thông (12/12...)
    ADD COLUMN IF NOT EXISTS professional_degree      VARCHAR(200),  -- trình độ chuyên môn cao nhất
    ADD COLUMN IF NOT EXISTS political_theory         VARCHAR(100),  -- lý luận chính trị
    ADD COLUMN IF NOT EXISTS state_management         VARCHAR(100),  -- quản lý nhà nước
    ADD COLUMN IF NOT EXISTS foreign_language         VARCHAR(200),  -- ngoại ngữ
    ADD COLUMN IF NOT EXISTS informatics_level        VARCHAR(100),  -- tin học
    -- Mục 23-30: đoàn thể, quân đội, chính sách, sức khỏe
    ADD COLUMN IF NOT EXISTS party_join_date          DATE,          -- ngày vào Đảng
    ADD COLUMN IF NOT EXISTS party_official_date      DATE,          -- ngày chính thức
    ADD COLUMN IF NOT EXISTS youth_union_join_date    DATE,          -- ngày vào Đoàn/tổ chức CT-XH
    ADD COLUMN IF NOT EXISTS military_service_from    DATE,          -- ngày nhập ngũ
    ADD COLUMN IF NOT EXISTS military_service_to      DATE,          -- ngày xuất ngũ
    ADD COLUMN IF NOT EXISTS war_invalid_class        VARCHAR(50),   -- thương binh hạng
    ADD COLUMN IF NOT EXISTS policy_family_type       VARCHAR(100),  -- con gia đình chính sách
    ADD COLUMN IF NOT EXISTS health_status            VARCHAR(255),  -- tình trạng sức khỏe (mã hóa)
    ADD COLUMN IF NOT EXISTS height_cm                SMALLINT,
    ADD COLUMN IF NOT EXISTS weight_kg                SMALLINT,
    ADD COLUMN IF NOT EXISTS blood_type               VARCHAR(10),
    ADD COLUMN IF NOT EXISTS personal_history         TEXT,          -- đặc điểm lịch sử bản thân
    ADD COLUMN IF NOT EXISTS family_economy           TEXT;          -- hoàn cảnh kinh tế gia đình

-- 2. Quá trình công tác (mục 31 HS02)
CREATE TABLE IF NOT EXISTS personnel.employee_work_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL,
    from_date     DATE NOT NULL,
    to_date       DATE,
    unit          VARCHAR(300) NOT NULL,  -- đơn vị công tác
    position      VARCHAR(200),           -- chức vụ/công việc đảm nhiệm
    note          VARCHAR(500),
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_work_history_employee ON personnel.employee_work_history(employee_id);

-- 3. Quá trình đào tạo, bồi dưỡng (mục 32 HS02)
CREATE TABLE IF NOT EXISTS personnel.employee_trainings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL,
    from_date     DATE,
    to_date       DATE,
    institution   VARCHAR(300) NOT NULL,  -- tên cơ sở đào tạo
    field         VARCHAR(200),           -- chuyên ngành
    form          VARCHAR(100),           -- hình thức (chính quy/tại chức/liên thông...)
    degree        VARCHAR(200),           -- văn bằng, chứng chỉ
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trainings_employee ON personnel.employee_trainings(employee_id);

-- 4. Quan hệ gia đình (mục 33-34 HS02): cha, mẹ, vợ/chồng, con, anh chị em ruột
CREATE TABLE IF NOT EXISTS personnel.employee_family_relations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL,
    side          VARCHAR(20) NOT NULL DEFAULT 'SELF',  -- SELF = bản thân, SPOUSE = bên vợ/chồng
    relation      VARCHAR(50) NOT NULL,                 -- Cha, Mẹ, Vợ, Chồng, Con, Anh/Chị/Em
    full_name     VARCHAR(150) NOT NULL,
    birth_year    SMALLINT,
    detail        VARCHAR(500),                          -- quê quán, nghề nghiệp, nơi ở...
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_family_relations_employee ON personnel.employee_family_relations(employee_id);

-- 5. Khen thưởng / Kỷ luật (mục 26-27 HS02)
CREATE TABLE IF NOT EXISTS personnel.employee_awards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL,
    type          VARCHAR(20) NOT NULL,   -- AWARD | DISCIPLINE
    year          SMALLINT,
    title         VARCHAR(300) NOT NULL,  -- danh hiệu/hình thức
    decision_no   VARCHAR(100),           -- số quyết định
    level         VARCHAR(150),           -- cấp khen thưởng/kỷ luật
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_awards_employee ON personnel.employee_awards(employee_id);
