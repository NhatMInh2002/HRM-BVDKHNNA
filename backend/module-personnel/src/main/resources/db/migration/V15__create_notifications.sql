CREATE TABLE personnel.notifications (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  UUID        NOT NULL,  -- employee.id
    type          VARCHAR(40) NOT NULL,  -- LEAVE_SUBMITTED, LEAVE_APPROVED, LEAVE_REJECTED, CHECKIN, PAYROLL, SYSTEM
    title         VARCHAR(200) NOT NULL,
    body          VARCHAR(500),
    link          VARCHAR(200),          -- frontend route to navigate to
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    reference_id  UUID,                 -- leaveRequest.id, payrollRecord.id, etc.
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient_unread
    ON personnel.notifications (recipient_id, is_read, created_at DESC);
