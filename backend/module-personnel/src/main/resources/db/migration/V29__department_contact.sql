-- V29 — Thông tin liên hệ phòng ban: SĐT liên hệ (hành chính) + SĐT trực (24/7)
-- manager_id (người đứng đầu) đã có sẵn từ trước.

ALTER TABLE personnel.departments
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS duty_phone    VARCHAR(30);
