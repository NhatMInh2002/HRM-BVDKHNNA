-- ============================================================
-- V38: Mở rộng cột national_id để chứa ciphertext AES-GCM
-- (định dạng "enc:v1:<base64>"). Dữ liệu cũ dạng plaintext vẫn
-- đọc được (converter fallback) và sẽ được mã hóa dần khi ghi lại.
-- Căn cứ: NĐ 13/2023/NĐ-CP — bảo vệ dữ liệu cá nhân nhạy cảm.
-- ============================================================

ALTER TABLE personnel.employees
    ALTER COLUMN national_id TYPE VARCHAR(255);
