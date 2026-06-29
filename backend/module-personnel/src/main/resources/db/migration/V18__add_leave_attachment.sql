ALTER TABLE attendance.leave_requests
    ADD COLUMN IF NOT EXISTS attachment_url  VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
