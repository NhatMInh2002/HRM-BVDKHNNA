-- ============================================================
-- V36: Tách 2 loại tuyển dụng — viên chức (thi/xét tuyển) và
-- hợp đồng công việc (theo Nghị định 235/2026/NĐ-CP), hiệu lực 01/7/2026
-- ============================================================

ALTER TABLE recruitment.job_postings
    ADD COLUMN recruitment_type VARCHAR(20) NOT NULL DEFAULT 'VIEN_CHUC'
        CHECK (recruitment_type IN ('VIEN_CHUC', 'HOP_DONG')),
    -- Chỉ áp dụng khi recruitment_type = 'HOP_DONG' — loại công việc theo Điều 4 NĐ 235/2026/NĐ-CP:
    -- VTVL_MANAGEMENT/PROFESSIONAL/SUPPORT = thuộc Danh mục vị trí việc làm viên chức
    -- SERVICE_DRIVER_SECURITY/SERVICE_OTHER = phục vụ ngoài danh mục (lái xe, bảo vệ, lễ tân, tạp vụ, bảo trì...)
    ADD COLUMN work_category VARCHAR(30)
        CHECK (work_category IN (
            'VTVL_MANAGEMENT', 'VTVL_PROFESSIONAL', 'VTVL_SUPPORT',
            'SERVICE_DRIVER_SECURITY', 'SERVICE_OTHER'
        )),
    -- Chỉ áp dụng khi recruitment_type = 'HOP_DONG' — thời hạn hợp đồng dự kiến (tháng)
    ADD COLUMN contract_duration_months SMALLINT;

CREATE INDEX idx_job_postings_recruitment_type ON recruitment.job_postings(recruitment_type);
