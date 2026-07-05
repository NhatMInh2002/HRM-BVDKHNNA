-- ============================================================
-- V35: Hồ sơ nhân viên (upload TCCB) + gợi ý OCR cho cấu hình lương
-- Chỉ tạo GỢI Ý (matched_*) — không tự ghi vào payroll.*_configs.
-- ============================================================

CREATE TABLE IF NOT EXISTS personnel.employee_documents (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id           UUID NOT NULL REFERENCES personnel.employees(id),
    doc_type              VARCHAR(30) NOT NULL,
    file_url              VARCHAR(1000) NOT NULL,
    file_name             VARCHAR(255),

    ocr_status            VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    extracted_text        TEXT,

    matched_label         VARCHAR(200),
    matched_coefficient   NUMERIC(5,2),
    matched_department_id UUID,
    matched_role_type     VARCHAR(10),
    matched_time_percent  NUMERIC(5,2),
    match_confidence      VARCHAR(20),

    verified              BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by           VARCHAR(100),
    verified_at           TIMESTAMP,

    uploaded_by           VARCHAR(100) NOT NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_documents_employee ON personnel.employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON personnel.employee_documents(employee_id, doc_type);
