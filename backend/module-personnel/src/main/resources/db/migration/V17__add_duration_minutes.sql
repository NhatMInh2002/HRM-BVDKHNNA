ALTER TABLE attendance.attendance_records
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
