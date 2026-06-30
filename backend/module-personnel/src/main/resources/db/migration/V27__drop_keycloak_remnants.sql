-- V27 — Dọn dẹp tàn dư Keycloak (chưa từng tích hợp thật, hệ thống dùng JWT tự quản lý)

DROP INDEX IF EXISTS personnel.idx_employees_keycloak_username;
ALTER TABLE personnel.employees DROP COLUMN IF EXISTS keycloak_username;

DROP SCHEMA IF EXISTS keycloak CASCADE;
