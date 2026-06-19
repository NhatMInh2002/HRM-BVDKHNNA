CREATE SCHEMA IF NOT EXISTS attendance;

-- Bản ghi chấm công từng ngày
CREATE TABLE attendance.attendance_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL,
    work_date       DATE NOT NULL,
    check_in        TIMESTAMPTZ,
    check_out       TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- PRESENT, ABSENT, LATE, HALF_DAY, LEAVE
    note            VARCHAR(255),
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, work_date)
);

-- Đơn xin nghỉ phép
CREATE TABLE attendance.leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL,
    leave_type      VARCHAR(30) NOT NULL, -- ANNUAL, SICK, MATERNITY, UNPAID, OTHER
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      NUMERIC(4,1) NOT NULL,
    reason          VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approved_by     VARCHAR(100),
    approved_at     TIMESTAMPTZ,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_employee_date ON attendance.attendance_records(employee_id, work_date);
CREATE INDEX idx_attendance_work_date ON attendance.attendance_records(work_date);
CREATE INDEX idx_leave_employee ON attendance.leave_requests(employee_id);
CREATE INDEX idx_leave_status ON attendance.leave_requests(status);
