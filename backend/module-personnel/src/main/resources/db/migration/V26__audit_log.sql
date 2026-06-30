-- ============================================================
-- V26 — Audit log bất biến (NĐ 13/2023, TT 12/2022)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    UUID,
    actor_name  VARCHAR(150),
    actor_role  VARCHAR(50),
    action      VARCHAR(50)  NOT NULL,   -- CREATE / UPDATE / DELETE / APPROVE / REJECT / LOGIN / EXPORT...
    entity_type VARCHAR(100) NOT NULL,   -- EMPLOYEE / PAYROLL / LEAVE_REQUEST / CONTRACT / PERMISSION ...
    entity_id   VARCHAR(100),
    before_data JSONB,
    after_data  JSONB,
    ip_address  VARCHAR(64),
    user_agent  VARCHAR(300),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity   ON audit.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit.audit_log(created_at DESC);

-- Bất biến: chặn UPDATE/DELETE ở mức DB — chỉ cho phép INSERT/SELECT.
-- Áp dụng cho role hrm (user kết nối của app). Nếu role khác, đổi tên ở đây.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hrm') THEN
        REVOKE UPDATE, DELETE ON audit.audit_log FROM hrm;
        GRANT INSERT, SELECT ON audit.audit_log TO hrm;
        GRANT USAGE, SELECT ON SEQUENCE audit.audit_log_id_seq TO hrm;
    END IF;
END $$;

-- Trigger chặn UPDATE/DELETE tuyệt đối (phòng trường hợp superuser dùng nhầm role khác)
CREATE OR REPLACE FUNCTION audit.prevent_audit_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit.audit_log là bất biến — không được UPDATE/DELETE (NĐ 13/2023)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit.audit_log;
CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit.audit_log
    FOR EACH ROW EXECUTE FUNCTION audit.prevent_audit_mutation();
