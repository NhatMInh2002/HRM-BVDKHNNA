-- V14: Xác thực nội bộ — thêm password_hash, bỏ phụ thuộc Keycloak
-- Mật khẩu mặc định tài khoản test: Admin@2025

ALTER TABLE personnel.employees
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Admin system account
INSERT INTO personnel.employees (
    id, employee_code, full_name, email, join_date, status, contract_type,
    created_by, hrm_role, password_hash
) VALUES (
    gen_random_uuid(), 'ADMIN01', 'Quản Trị Hệ Thống', 'admin@bvnghean.vn',
    CURRENT_DATE, 'ACTIVE', 'INDEFINITE', 'system',
    'ADMIN', '$2a$10$P6igQEVMGMjJq3IHL0kNsuF2IfGAKRt4TSmHqkJna/xFr1OqYBJWS'
) ON CONFLICT (email) DO UPDATE SET
    hrm_role      = 'ADMIN',
    password_hash = '$2a$10$P6igQEVMGMjJq3IHL0kNsuF2IfGAKRt4TSmHqkJna/xFr1OqYBJWS';
