-- V28 — 2FA bằng TOTP (Google/Microsoft Authenticator), thay cho form "đăng ký SĐT" treo trước đây

ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS totp_secret  VARCHAR(64),
    ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS totp_confirmed_at TIMESTAMPTZ;
