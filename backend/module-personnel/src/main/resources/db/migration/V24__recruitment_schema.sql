-- ============================================================
-- V24: Module Tuyển dụng — job_postings, candidates, interviews
-- Phase 4 — Week 29-31
-- ============================================================

CREATE SCHEMA IF NOT EXISTS recruitment;

-- 1. Tin tuyển dụng
CREATE TABLE recruitment.job_postings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200)    NOT NULL,
    department_id   UUID            REFERENCES personnel.departments(id),
    quantity        SMALLINT        NOT NULL DEFAULT 1,
    position        VARCHAR(100),
    description     TEXT,
    requirements    TEXT,
    benefits        TEXT,
    salary_range    VARCHAR(100),
    deadline        DATE,
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    -- DRAFT → OPEN → CLOSED
    created_by      VARCHAR(100)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- 2. Ứng viên
CREATE TABLE recruitment.candidates (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id  UUID            REFERENCES recruitment.job_postings(id) ON DELETE SET NULL,
    full_name       VARCHAR(200)    NOT NULL,
    email           VARCHAR(200),
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          VARCHAR(10),
    cv_url          VARCHAR(500),
    source          VARCHAR(50)     NOT NULL DEFAULT 'DIRECT',
    -- DIRECT, REFERRAL, HEADHUNT, ONLINE_JOB, LINKEDIN, OTHER
    stage           VARCHAR(30)     NOT NULL DEFAULT 'NEW',
    -- NEW → SCREENING → INTERVIEW → OFFER → HIRED | REJECTED
    reject_reason   VARCHAR(300),
    notes           TEXT,
    created_by      VARCHAR(100)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- 3. Lịch phỏng vấn
CREATE TABLE recruitment.interviews (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID            NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMP       NOT NULL,
    interview_type  VARCHAR(30)     NOT NULL DEFAULT 'IN_PERSON',
    -- IN_PERSON, ONLINE, PHONE
    interviewer     VARCHAR(200),
    location        VARCHAR(200),
    result          VARCHAR(20)     DEFAULT 'PENDING',
    -- PENDING, PASS, FAIL
    score           SMALLINT,       -- 1-10
    notes           TEXT,
    created_by      VARCHAR(100)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_candidates_job    ON recruitment.candidates(job_posting_id);
CREATE INDEX idx_candidates_stage  ON recruitment.candidates(stage);
CREATE INDEX idx_interviews_cand   ON recruitment.interviews(candidate_id);

-- 4. Seed dữ liệu demo
INSERT INTO recruitment.job_postings (title, department_id, quantity, position, description, requirements, salary_range, deadline, status, created_by)
SELECT 'Điều dưỡng hạng III — Khoa Ngoại Tổng Hợp',
       (SELECT id FROM personnel.departments WHERE code = 'K-NT' LIMIT 1),
       3, 'Điều dưỡng hạng III',
       'Chăm sóc người bệnh sau phẫu thuật, thực hiện y lệnh, ghi chép hồ sơ bệnh án.',
       'Bằng cử nhân Điều dưỡng. Chứng chỉ hành nghề. Ưu tiên có kinh nghiệm.',
       'Theo thang bậc lương viên chức (hệ số 2.34+)',
       '2026-08-31', 'OPEN', 'admin@bvnghean.vn'
WHERE EXISTS (SELECT 1 FROM personnel.departments WHERE code = 'K-NT');

INSERT INTO recruitment.job_postings (title, department_id, quantity, position, description, requirements, salary_range, deadline, status, created_by)
SELECT 'Bác sĩ CKI — Khoa Nội Tim Mạch',
       (SELECT id FROM personnel.departments WHERE code = 'K-TM' LIMIT 1),
       1, 'Bác sĩ chuyên khoa I',
       'Khám, chẩn đoán và điều trị bệnh nhân tim mạch. Trực theo phân công.',
       'Bằng Bác sĩ CKI Tim Mạch hoặc Nội Khoa. Chứng chỉ hành nghề còn hiệu lực.',
       'Ngạch A2.2, bậc 1–4 (hệ số 4.00–5.02)',
       '2026-09-15', 'OPEN', 'admin@bvnghean.vn'
WHERE EXISTS (SELECT 1 FROM personnel.departments WHERE code = 'K-TM');

INSERT INTO recruitment.job_postings (title, department_id, quantity, position, description, requirements, salary_range, deadline, status, created_by)
VALUES ('Chuyên viên Hành chính — Phòng Tổ chức Cán bộ',
        (SELECT id FROM personnel.departments WHERE code = 'P-TCCB' LIMIT 1),
        2, 'Chuyên viên hành chính',
        'Quản lý hồ sơ nhân sự, soạn thảo văn bản hành chính, hỗ trợ công tác tuyển dụng.',
        'Đại học chuyên ngành Luật, QTKD hoặc Hành chính công. Thành thạo tin học văn phòng.',
        'Ngạch A1, bậc 1–3 (hệ số 2.34–3.00)',
        '2026-07-31', 'OPEN', 'admin@bvnghean.vn');

-- Ứng viên mẫu
INSERT INTO recruitment.candidates (full_name, email, phone, job_posting_id, stage, source, notes, created_by)
SELECT 'Trần Thị Hoa', 'hoa.tran@gmail.com', '0912345001',
       (SELECT id FROM recruitment.job_postings WHERE title LIKE '%Điều dưỡng%' LIMIT 1),
       'INTERVIEW', 'ONLINE_JOB',
       'Tốt nghiệp loại Giỏi ĐH Y Dược Vinh. Có 2 năm KN tại BV huyện.',
       'admin@bvnghean.vn';

INSERT INTO recruitment.candidates (full_name, email, phone, job_posting_id, stage, source, notes, created_by)
SELECT 'Nguyễn Văn Minh', 'minh.nv@gmail.com', '0987654002',
       (SELECT id FROM recruitment.job_postings WHERE title LIKE '%Điều dưỡng%' LIMIT 1),
       'SCREENING', 'DIRECT',
       'Nộp hồ sơ trực tiếp. Chờ xét hồ sơ.',
       'admin@bvnghean.vn';

INSERT INTO recruitment.candidates (full_name, email, phone, job_posting_id, stage, source, notes, created_by)
SELECT 'Lê Thị Thu', 'thu.le@gmail.com', '0978123003',
       (SELECT id FROM recruitment.job_postings WHERE title LIKE '%Bác sĩ%' LIMIT 1),
       'OFFER', 'HEADHUNT',
       'CKI Tim Mạch, 5 năm KN tại BV Nghệ An. Lương đề xuất: ngạch A2.2 bậc 3.',
       'admin@bvnghean.vn';

INSERT INTO recruitment.candidates (full_name, email, phone, job_posting_id, stage, source, notes, created_by)
SELECT 'Phạm Quốc Hùng', 'hung.pq@gmail.com', '0965432104',
       (SELECT id FROM recruitment.job_postings WHERE title LIKE '%Chuyên viên%' LIMIT 1),
       'NEW', 'ONLINE_JOB',
       'Cử nhân Luật, có kinh nghiệm 1 năm hành chính.',
       'admin@bvnghean.vn';

INSERT INTO recruitment.candidates (full_name, email, phone, job_posting_id, stage, source, notes, created_by)
SELECT 'Hoàng Thị Mai', 'mai.ht@gmail.com', '0912000105',
       (SELECT id FROM recruitment.job_postings WHERE title LIKE '%Chuyên viên%' LIMIT 1),
       'SCREENING', 'REFERRAL',
       'Giới thiệu từ Phòng TCCB. QTKD, có 2 năm làm nhân sự.',
       'admin@bvnghean.vn';

-- Lịch phỏng vấn mẫu
INSERT INTO recruitment.interviews (candidate_id, scheduled_at, interview_type, interviewer, location, result, notes, created_by)
SELECT c.id,
       '2026-07-05 09:00:00',
       'IN_PERSON',
       'BS. Trưởng khoa Ngoại — Nguyễn Văn An',
       'Phòng họp tầng 3',
       'PASS',
       'Ứng viên trả lời tốt, đề nghị chuyển sang vòng đề xuất lương.',
       'admin@bvnghean.vn'
FROM recruitment.candidates c WHERE c.full_name = 'Trần Thị Hoa';
